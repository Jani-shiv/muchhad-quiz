import { redis } from '../config/redis.js';

const ROOM_TTL_SECONDS = 6 * 60 * 60; // 6 hours

const roomKey = (pin) => `room:${pin}`;
const playersKey = (pin) => `room:${pin}:players`;
const answersKey = (pin, qIdx) => `room:${pin}:answers:${qIdx}`;
const bannedKey = (pin) => `room:${pin}:banned`;

export async function createRoom({ pin, sessionId, quizId, quizTitle, hostId, settings, questions }) {
  const state = {
    pin,
    sessionId,
    quizId,
    quizTitle,
    hostId,
    settings,
    questions,
    status: 'LOBBY', // LOBBY | QUESTION | PAUSED | REVEAL | PODIUM
    currentQuestionIndex: 0,
    locked: false,
    questionStartedAt: 0,
    questionEndsAt: 0,
    pausedRemainingMs: 0,
    pauseReason: '',
    createdAt: Date.now(),
  };

  await redis.set(roomKey(pin), JSON.stringify(state), 'EX', ROOM_TTL_SECONDS);
  return state;
}

export async function getRoom(pin) {
  const raw = await redis.get(roomKey(pin));
  return raw ? JSON.parse(raw) : null;
}

export async function saveRoom(state) {
  await redis.set(roomKey(state.pin), JSON.stringify(state), 'EX', ROOM_TTL_SECONDS);
}

export async function isBanned(pin, sessionToken) {
  return (await redis.sismember(bannedKey(pin), sessionToken)) === 1;
}

export async function banPlayerToken(pin, sessionToken) {
  await redis.sadd(bannedKey(pin), sessionToken);
  await redis.expire(bannedKey(pin), ROOM_TTL_SECONDS);
}

export async function getPlayer(pin, sessionToken) {
  const raw = await redis.hget(playersKey(pin), sessionToken);
  return raw ? JSON.parse(raw) : null;
}

export async function savePlayer(pin, player) {
  await redis.hset(playersKey(pin), player.sessionToken, JSON.stringify(player));
  await redis.expire(playersKey(pin), ROOM_TTL_SECONDS);
}

export async function removePlayer(pin, sessionToken) {
  await redis.hdel(playersKey(pin), sessionToken);
}

export async function getAllPlayers(pin) {
  const map = await redis.hgetall(playersKey(pin));
  return Object.values(map).map((raw) => JSON.parse(raw));
}

export async function getAnswer(pin, qIdx, sessionToken) {
  const raw = await redis.hget(answersKey(pin, qIdx), sessionToken);
  return raw ? JSON.parse(raw) : null;
}

export async function saveAnswer(pin, qIdx, sessionToken, answerRecord) {
  await redis.hset(answersKey(pin, qIdx), sessionToken, JSON.stringify(answerRecord));
  await redis.expire(answersKey(pin, qIdx), ROOM_TTL_SECONDS);
}

export async function getAllAnswers(pin, qIdx) {
  const map = await redis.hgetall(answersKey(pin, qIdx));
  return Object.values(map).map((raw) => JSON.parse(raw));
}
