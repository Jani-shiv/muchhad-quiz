import crypto from 'crypto';
import { verifyHostToken } from '../middleware/auth.js';
import { filterNickname } from '../middleware/sanitize.js';
import { socketRateLimiter } from '../middleware/rateLimit.js';
import {
  getRoom,
  saveRoom,
  isBanned,
  banPlayerToken,
  getPlayer,
  savePlayer,
  removePlayer,
  getAllPlayers,
  getAnswer,
  saveAnswer,
} from '../services/roomStore.js';
import { calculateScore } from '../services/scoring.js';
import {
  startQuestion,
  pauseGame,
  resumeGame,
  revealQuestion,
  finishGame,
  markStatsDirty,
  sanitizeQuestionForClient,
} from '../services/gameEngine.js';

function publicPlayerSummary(p) {
  return {
    sessionToken: p.sessionToken,
    nickname: p.nickname,
    avatarId: p.avatarId,
    connected: p.connected,
    score: p.score,
    streak: p.streak,
  };
}

function makeUniqueNickname(desired, existingPlayers, selfToken) {
  const taken = new Set(
    existingPlayers
      .filter((p) => p.sessionToken !== selfToken)
      .map((p) => p.nickname.toLowerCase())
  );
  if (!taken.has(desired.toLowerCase())) return desired;
  let suffix = 2;
  while (taken.has(`${desired}_${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${desired.slice(0, 20)}_${suffix}`;
}

async function verifyHostSocket(socket, pin) {
  if (!socket.data.hostUser) return null;
  const room = await getRoom(pin);
  if (!room || room.hostId !== socket.data.hostUser.sub) return null;
  return room;
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // --------------------------------------------------------
    // HOST EVENTS
    // --------------------------------------------------------
    socket.on('host:join_room', async ({ pin, token }) => {
      try {
        const user = verifyHostToken(token);
        const room = await getRoom(pin);
        if (!room || room.hostId !== user.sub) {
          return socket.emit('error:toast', { code: 'UNAUTHORIZED', message: 'Invalid room or host credentials.' });
        }

        socket.data.role = 'host';
        socket.data.pin = pin;
        socket.data.hostUser = user;
        socket.join(`pin:${pin}`);
        socket.join(`host:${pin}`);

        const players = await getAllPlayers(pin);
        socket.emit('room:state', {
          status: room.status,
          pin: room.pin,
          quizTitle: room.quizTitle,
          settings: room.settings,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.questions.length,
          locked: room.locked,
          playerCount: players.length,
          pauseReason: room.pauseReason,
          remainingMs: room.pausedRemainingMs,
        });
        socket.emit('lobby:players', { players: players.map(publicPlayerSummary) });

        // Auto-resume prompt or send current question if active
        if (room.status === 'QUESTION' || room.status === 'PAUSED') {
          const q = room.questions[room.currentQuestionIndex];
          socket.emit('question:start', {
            ...sanitizeQuestionForClient(q, room.currentQuestionIndex, room.questions.length),
            startedAt: room.questionStartedAt,
            endsAt: room.questionEndsAt,
            serverTime: Date.now(),
            settings: room.settings,
          });
        }
      } catch {
        socket.emit('error:toast', { code: 'AUTH_FAILED', message: 'Host authentication failed.' });
      }
    });

    socket.on('host:start_game', async ({ pin }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room || room.status !== 'LOBBY') return;
      await startQuestion(io, pin, 0);
    });

    socket.on('host:next_question', async ({ pin }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      await startQuestion(io, pin, room.currentQuestionIndex + 1);
    });

    socket.on('host:pause_game', async ({ pin }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      await pauseGame(io, pin, 'host_paused');
    });

    socket.on('host:resume_game', async ({ pin }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      await resumeGame(io, pin);
    });

    socket.on('host:skip_question', async ({ pin }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      await revealQuestion(io, pin);
    });

    socket.on('host:reveal_answer', async ({ pin }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      await revealQuestion(io, pin);
    });

    socket.on('host:end_game', async ({ pin }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      await finishGame(io, pin);
    });

    socket.on('host:lock_room', async ({ pin, locked }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      room.locked = Boolean(locked);
      await saveRoom(room);
      io.to(`pin:${pin}`).emit('room:locked', { locked: room.locked });
    });

    socket.on('host:kick_player', async ({ pin, sessionToken }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      const target = await getPlayer(pin, sessionToken);
      if (target) {
        if (target.socketId) {
          io.to(target.socketId).emit('player:kicked', { banned: false, reason: 'Removed by host.' });
        }
        await removePlayer(pin, sessionToken);
        const players = await getAllPlayers(pin);
        io.to(`pin:${pin}`).emit('lobby:players', { players: players.map(publicPlayerSummary) });
      }
    });

    socket.on('host:ban_player', async ({ pin, sessionToken }) => {
      const room = await verifyHostSocket(socket, pin);
      if (!room) return;
      await banPlayerToken(pin, sessionToken);
      const target = await getPlayer(pin, sessionToken);
      if (target) {
        if (target.socketId) {
          io.to(target.socketId).emit('player:kicked', { banned: true, reason: 'Banned by host.' });
        }
        await removePlayer(pin, sessionToken);
        const players = await getAllPlayers(pin);
        io.to(`pin:${pin}`).emit('lobby:players', { players: players.map(publicPlayerSummary) });
      }
    });

    // --------------------------------------------------------
    // PROJECTOR EVENTS
    // --------------------------------------------------------
    socket.on('projector:join', async ({ pin }) => {
      const room = await getRoom(pin);
      if (!room) {
        return socket.emit('error:toast', { code: 'ROOM_NOT_FOUND', message: 'Game PIN not found.' });
      }
      socket.data.role = 'projector';
      socket.data.pin = pin;
      socket.join(`pin:${pin}`);
      socket.join(`projector:${pin}`);

      const players = await getAllPlayers(pin);
      socket.emit('room:state', {
        status: room.status,
        pin: room.pin,
        quizTitle: room.quizTitle,
        settings: room.settings,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.questions.length,
        locked: room.locked,
        playerCount: players.length,
      });
      socket.emit('lobby:players', { players: players.map(publicPlayerSummary) });

      if (room.status === 'QUESTION' || room.status === 'PAUSED') {
        const q = room.questions[room.currentQuestionIndex];
        socket.emit('question:start', {
          ...sanitizeQuestionForClient(q, room.currentQuestionIndex, room.questions.length),
          startedAt: room.questionStartedAt,
          endsAt: room.questionEndsAt,
          serverTime: Date.now(),
          settings: room.settings,
        });
      }
    });

    // --------------------------------------------------------
    // PLAYER EVENTS
    // --------------------------------------------------------
    socket.on('player:join', async ({ pin, nickname, avatarId, sessionToken }) => {
      if (!socketRateLimiter.allow(socket.id, 'player:join', 5, 5000)) {
        return socket.emit('error:toast', { code: 'RATE_LIMIT', message: 'Too many join attempts.' });
      }

      const cleanPin = String(pin || '').trim();
      const room = await getRoom(cleanPin);
      if (!room) {
        return socket.emit('error:toast', { code: 'ROOM_NOT_FOUND', message: 'Room not found. Check the 6-digit PIN.' });
      }

      if (sessionToken && (await isBanned(cleanPin, sessionToken))) {
        return socket.emit('player:kicked', { banned: true, reason: 'You are banned from this room.' });
      }

      let player = sessionToken ? await getPlayer(cleanPin, sessionToken) : null;

      if (!player) {
        if (room.locked) {
          return socket.emit('error:toast', { code: 'ROOM_LOCKED', message: 'Room is locked by host.' });
        }
        const existingPlayers = await getAllPlayers(cleanPin);
        const token = sessionToken || crypto.randomBytes(16).toString('hex');
        const safeName = makeUniqueNickname(filterNickname(nickname), existingPlayers, token);
        const safeAvatar = Math.min(10, Math.max(1, parseInt(avatarId, 10) || 1));

        player = {
          sessionToken: token,
          nickname: safeName,
          avatarId: safeAvatar,
          score: 0,
          streak: 0,
          correctCount: 0,
          totalResponseMs: 0,
          used5050: false,
          usedDouble: false,
          connected: true,
          socketId: socket.id,
        };
      } else {
        // Reconnect: restore identity, avatar, score, streak
        player.connected = true;
        player.socketId = socket.id;
      }

      await savePlayer(cleanPin, player);
      socket.data.role = 'player';
      socket.data.pin = cleanPin;
      socket.data.sessionToken = player.sessionToken;
      socket.join(`pin:${cleanPin}`);

      socket.emit('player:joined', {
        sessionToken: player.sessionToken,
        nickname: player.nickname,
        avatarId: player.avatarId,
        score: player.score,
        streak: player.streak,
        used5050: player.used5050,
        usedDouble: player.usedDouble,
        roomStatus: room.status,
        quizTitle: room.quizTitle,
        settings: room.settings,
      });

      const players = await getAllPlayers(cleanPin);
      io.to(`pin:${cleanPin}`).emit('lobby:players', { players: players.map(publicPlayerSummary) });

      // Late join or reconnect mid-question
      if (room.status === 'QUESTION' || room.status === 'PAUSED') {
        const q = room.questions[room.currentQuestionIndex];
        const existingAns = await getAnswer(cleanPin, room.currentQuestionIndex, player.sessionToken);
        socket.emit('question:start', {
          ...sanitizeQuestionForClient(q, room.currentQuestionIndex, room.questions.length),
          startedAt: room.questionStartedAt,
          endsAt: room.questionEndsAt,
          serverTime: Date.now(),
          settings: room.settings,
          alreadyAnswered: Boolean(existingAns),
        });
        if (room.status === 'PAUSED') {
          socket.emit('game:paused', { remainingMs: room.pausedRemainingMs, reason: room.pauseReason });
        }
      }
    });

    socket.on('player:use_powerup', async ({ pin, questionIndex, type }) => {
      if (!socketRateLimiter.allow(socket.id, 'player:powerup', 4, 3000)) return;
      const room = await getRoom(pin);
      if (!room || room.status !== 'QUESTION' || room.currentQuestionIndex !== questionIndex) return;
      if (!room.settings?.enablePowerUps) return;

      const player = await getPlayer(pin, socket.data.sessionToken);
      if (!player) return;

      if (type === '50_50' && !player.used5050) {
        const q = room.questions[questionIndex];
        if (q.type !== 'single_choice') return;
        const wrongIndices = q.options
          .map((_, idx) => idx)
          .filter((idx) => idx !== parseInt(q.correct_answer, 10));
        // Shuffle and pick up to 2 wrong indices to hide
        const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
        player.used5050 = true;
        await savePlayer(pin, player);
        socket.emit('player:powerup_result', { type: '50_50', hiddenIndices: toHide });
      } else if (type === 'double_points' && !player.usedDouble) {
        player.usedDouble = true;
        player.activeDoubleQuestion = questionIndex;
        await savePlayer(pin, player);
        socket.emit('player:powerup_result', { type: 'double_points', active: true });
      }
    });

    socket.on('player:answer', async ({ pin, questionIndex, answer }) => {
      if (!socketRateLimiter.allow(socket.id, 'player:answer', 6, 2000)) {
        return socket.emit('error:toast', { code: 'RATE_LIMIT', message: 'Slow down!' });
      }

      const receivedAt = Date.now();
      const room = await getRoom(pin);
      if (!room || room.status !== 'QUESTION' || room.currentQuestionIndex !== questionIndex) {
        return socket.emit('error:toast', { code: 'QUESTION_CLOSED', message: 'Question is not active.' });
      }
      if (receivedAt > room.questionEndsAt + 400) {
        return socket.emit('error:toast', { code: 'TIME_UP', message: 'Time is up!' });
      }

      const token = socket.data.sessionToken;
      if (!token) return;
      const player = await getPlayer(pin, token);
      if (!player) return;

      const existing = await getAnswer(pin, questionIndex, token);
      if (existing && !room.settings?.allowAnswerChange) {
        return socket.emit('error:toast', { code: 'ALREADY_ANSWERED', message: 'Answer already locked.' });
      }

      const question = room.questions[questionIndex];
      const doubleActive = player.activeDoubleQuestion === questionIndex;
      const result = calculateScore({
        question,
        submittedAnswer: answer,
        receivedAt,
        startedAt: room.questionStartedAt,
        endsAt: room.questionEndsAt,
        currentStreak: player.streak,
        settings: room.settings,
        doublePointsActive: doubleActive,
      });

      await saveAnswer(pin, questionIndex, token, {
        sessionToken: token,
        answer,
        receivedAt,
        ...result,
      });

      markStatsDirty(pin);
      socket.emit('player:answer_ack', {
        questionIndex,
        locked: !room.settings?.allowAnswerChange,
      });
    });

    socket.on('player:reaction', async ({ pin, emoji }) => {
      if (!socketRateLimiter.allow(socket.id, 'player:reaction', 1, 1500)) return;
      const ALLOWED = new Set(['🔥', '🎉', '🤯', '😂', '👏', '💀']);
      if (!ALLOWED.has(emoji)) return;

      const room = await getRoom(pin);
      if (!room || !room.settings?.enableReactions) return;
      const player = await getPlayer(pin, socket.data.sessionToken);
      if (!player) return;

      io.to(`projector:${pin}`).emit('projector:reaction', {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        emoji,
        nickname: player.nickname,
      });
    });

    // --------------------------------------------------------
    // DISCONNECT / HEARTBEAT HANDLING
    // --------------------------------------------------------
    socket.on('disconnect', async () => {
      socketRateLimiter.cleanup(socket.id);
      const { role, pin, sessionToken } = socket.data;
      if (!pin) return;

      if (role === 'host') {
        const room = await getRoom(pin);
        if (room && room.status === 'QUESTION') {
          await pauseGame(io, pin, 'host_disconnected');
        }
      } else if (role === 'player' && sessionToken) {
        const player = await getPlayer(pin, sessionToken);
        if (player && player.socketId === socket.id) {
          player.connected = false;
          await savePlayer(pin, player);
          const players = await getAllPlayers(pin);
          io.to(`pin:${pin}`).emit('lobby:players', { players: players.map(publicPlayerSummary) });
        }
      }
    });
  });
}
