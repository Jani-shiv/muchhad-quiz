import { query } from '../config/db.js';
import {
  getRoom,
  saveRoom,
  getAllPlayers,
  savePlayer,
  getAllAnswers,
} from './roomStore.js';
import { sortLeaderboard } from './scoring.js';

// Per-node active timers & 250ms batch flushers
const roomTimers = new Map();
const dirtyBatchRooms = new Set();

export function sanitizeQuestionForClient(question, index, total) {
  return {
    index,
    total,
    type: question.type,
    text: question.text,
    imageUrl: question.image_url || '',
    options: question.options || [],
    timeLimit: question.time_limit,
    pointsMode: question.points_mode,
  };
}

export function buildDistribution(question, answers) {
  const dist = {};
  if (question.type === 'type_answer') {
    for (const ans of answers) {
      const key = String(ans.answer || '').trim().toLowerCase() || '(blank)';
      dist[key] = (dist[key] || 0) + 1;
    }
    return dist;
  }

  const opts = question.options || [];
  for (let i = 0; i < opts.length; i++) dist[i] = 0;

  for (const ans of answers) {
    if (Array.isArray(ans.answer)) {
      for (const idx of ans.answer) {
        if (dist[idx] !== undefined) dist[idx] += 1;
      }
    } else {
      const idx = parseInt(ans.answer, 10);
      if (dist[idx] !== undefined) dist[idx] += 1;
    }
  }
  return dist;
}

export function markStatsDirty(pin) {
  dirtyBatchRooms.add(pin);
}

export function startBatchTicker(io) {
  setInterval(async () => {
    if (dirtyBatchRooms.size === 0) return;
    const pins = [...dirtyBatchRooms];
    dirtyBatchRooms.clear();

    for (const pin of pins) {
      try {
        const room = await getRoom(pin);
        if (!room || room.status !== 'QUESTION') continue;
        const q = room.questions[room.currentQuestionIndex];
        const [players, answers] = await Promise.all([
          getAllPlayers(pin),
          getAllAnswers(pin, room.currentQuestionIndex),
        ]);
        const connectedCount = players.filter((p) => p.connected).length;
        const distribution = buildDistribution(q, answers);

        io.to(`pin:${pin}`).emit('stats:batch', {
          questionIndex: room.currentQuestionIndex,
          answeredCount: answers.length,
          totalConnected: connectedCount,
          distribution,
        });
      } catch (err) {
        console.error(`[GameEngine] Batch stats error for ${pin}:`, err.message);
      }
    }
  }, 250);
}

export function clearRoomTimer(pin) {
  const handle = roomTimers.get(pin);
  if (handle) {
    clearTimeout(handle);
    roomTimers.delete(pin);
  }
}

export function scheduleQuestionTimeout(io, pin, durationMs) {
  clearRoomTimer(pin);
  const handle = setTimeout(() => {
    revealQuestion(io, pin).catch((err) =>
      console.error(`[GameEngine] Auto-reveal error for ${pin}:`, err)
    );
  }, Math.max(50, durationMs));
  roomTimers.set(pin, handle);
}

export async function startQuestion(io, pin, questionIndex) {
  const room = await getRoom(pin);
  if (!room) return;

  if (questionIndex >= room.questions.length) {
    await finishGame(io, pin);
    return;
  }

  const question = room.questions[questionIndex];
  const now = Date.now();
  const durationMs = (question.time_limit || 20) * 1000;

  room.status = 'QUESTION';
  room.currentQuestionIndex = questionIndex;
  room.questionStartedAt = now;
  room.questionEndsAt = now + durationMs;
  room.pausedRemainingMs = 0;
  room.pauseReason = '';
  await saveRoom(room);

  if (questionIndex === 0) {
    await query(
      `UPDATE game_sessions SET status = 'ACTIVE', started_at = COALESCE(started_at, NOW()) WHERE id = $1`,
      [room.sessionId]
    );
  }

  const payload = {
    ...sanitizeQuestionForClient(question, questionIndex, room.questions.length),
    startedAt: now,
    endsAt: room.questionEndsAt,
    serverTime: now,
    settings: room.settings,
  };

  io.to(`pin:${pin}`).emit('question:start', payload);
  scheduleQuestionTimeout(io, pin, durationMs);
}

export async function pauseGame(io, pin, reason = 'host_paused') {
  const room = await getRoom(pin);
  if (!room || room.status !== 'QUESTION') return null;

  clearRoomTimer(pin);
  const remainingMs = Math.max(1000, room.questionEndsAt - Date.now());
  room.status = 'PAUSED';
  room.pausedRemainingMs = remainingMs;
  room.pauseReason = reason;
  await saveRoom(room);

  io.to(`pin:${pin}`).emit('game:paused', { remainingMs, reason });
  return room;
}

export async function resumeGame(io, pin) {
  const room = await getRoom(pin);
  if (!room || room.status !== 'PAUSED') return null;

  const now = Date.now();
  const remainingMs = Math.max(1000, room.pausedRemainingMs || 5000);
  room.status = 'QUESTION';
  room.questionEndsAt = now + remainingMs;
  room.pausedRemainingMs = 0;
  room.pauseReason = '';
  await saveRoom(room);

  io.to(`pin:${pin}`).emit('game:resumed', {
    endsAt: room.questionEndsAt,
    remainingMs,
    serverTime: now,
  });

  scheduleQuestionTimeout(io, pin, remainingMs);
  return room;
}

export async function revealQuestion(io, pin) {
  const room = await getRoom(pin);
  if (!room || (room.status !== 'QUESTION' && room.status !== 'PAUSED')) return;

  clearRoomTimer(pin);
  room.status = 'REVEAL';
  await saveRoom(room);

  const qIdx = room.currentQuestionIndex;
  const question = room.questions[qIdx];
  const [players, answers] = await Promise.all([
    getAllPlayers(pin),
    getAllAnswers(pin, qIdx),
  ]);

  const answerMap = new Map(answers.map((a) => [a.sessionToken, a]));

  // Commit scores to Redis players
  for (const player of players) {
    const ans = answerMap.get(player.sessionToken);
    if (ans) {
      player.score = Math.max(0, player.score + ans.pointsEarned);
      player.streak = ans.newStreak;
      player.totalResponseMs += ans.responseMs;
      if (ans.isCorrect) player.correctCount += 1;
      await savePlayer(pin, player);
    } else if (question.type !== 'poll') {
      player.streak = 0;
      await savePlayer(pin, player);
    }
  }

  const ranked = sortLeaderboard(players);
  const rankMap = new Map(ranked.map((p, idx) => [p.sessionToken, idx + 1]));

  const top5 = ranked.slice(0, 5).map((p, idx) => ({
    rank: idx + 1,
    sessionToken: p.sessionToken,
    nickname: p.nickname,
    avatarId: p.avatarId,
    score: p.score,
    streak: p.streak,
  }));

  const distribution = buildDistribution(question, answers);

  io.to(`pin:${pin}`).emit('question:reveal', {
    index: qIdx,
    correctAnswer: question.correct_answer,
    distribution,
    answeredCount: answers.length,
    totalPlayers: players.length,
    top5,
  });

  // Send personalized feedback to each connected player socket
  for (const player of ranked) {
    if (!player.socketId) continue;
    const ans = answerMap.get(player.sessionToken);
    io.to(player.socketId).emit('player:feedback', {
      questionIndex: qIdx,
      answered: Boolean(ans),
      correct: ans ? ans.isCorrect : false,
      isPoll: question.type === 'poll',
      pointsEarned: ans ? ans.pointsEarned : 0,
      totalScore: player.score,
      streak: player.streak,
      rank: rankMap.get(player.sessionToken) || ranked.length,
      totalPlayers: ranked.length,
    });
  }
}

export async function finishGame(io, pin) {
  const room = await getRoom(pin);
  if (!room) return;

  clearRoomTimer(pin);
  room.status = 'PODIUM';
  await saveRoom(room);

  const players = await getAllPlayers(pin);
  const ranked = sortLeaderboard(players);

  await query(
    `UPDATE game_sessions SET status = 'FINISHED', player_count = $1, ended_at = NOW() WHERE id = $2`,
    [ranked.length, room.sessionId]
  );

  // Persist results
  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i];
    await query(
      `INSERT INTO session_results
       (session_id, player_token, nickname, avatar_id, final_score, correct_count, total_questions, total_response_ms, final_rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        room.sessionId,
        p.sessionToken,
        p.nickname,
        p.avatarId,
        p.score,
        p.correctCount,
        room.questions.length,
        p.totalResponseMs,
        i + 1,
      ]
    );
  }

  const leaderboard = ranked.slice(0, 20).map((p, idx) => ({
    rank: idx + 1,
    sessionToken: p.sessionToken,
    nickname: p.nickname,
    avatarId: p.avatarId,
    score: p.score,
    correctCount: p.correctCount,
    totalResponseMs: p.totalResponseMs,
  }));

  io.to(`pin:${pin}`).emit('game:podium', {
    sessionId: room.sessionId,
    quizTitle: room.quizTitle,
    totalQuestions: room.questions.length,
    podium: leaderboard.slice(0, 3),
    leaderboard,
  });

  // Also send each player their exact final rank (even outside top 20)
  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i];
    if (p.socketId) {
      io.to(p.socketId).emit('player:final_rank', {
        rank: i + 1,
        totalPlayers: ranked.length,
        score: p.score,
        correctCount: p.correctCount,
        totalQuestions: room.questions.length,
      });
    }
  }
}
