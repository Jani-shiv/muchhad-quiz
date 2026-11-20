export function getBasePoints(pointsMode) {
  if (pointsMode === 'double') return 2000;
  if (pointsMode === 'none') return 0;
  return 1000;
}

export function evaluateAnswer(question, submittedAnswer) {
  if (question.type === 'poll') {
    return { isCorrect: false, isPoll: true };
  }

  const correct = question.correct_answer;
  if (question.type === 'single_choice' || question.type === 'true_false') {
    const sub = parseInt(submittedAnswer, 10);
    return { isCorrect: sub === parseInt(correct, 10), isPoll: false };
  }

  if (question.type === 'multiple_choice') {
    if (!Array.isArray(submittedAnswer) || !Array.isArray(correct)) {
      return { isCorrect: false, isPoll: false };
    }
    const a = [...new Set(submittedAnswer.map((n) => parseInt(n, 10)))].sort((x, y) => x - y);
    const b = [...new Set(correct.map((n) => parseInt(n, 10)))].sort((x, y) => x - y);
    const match = a.length === b.length && a.every((v, i) => v === b[i]);
    return { isCorrect: match, isPoll: false };
  }

  if (question.type === 'type_answer') {
    const normSub = String(submittedAnswer ?? '').trim().toLowerCase();
    const accepted = Array.isArray(correct) ? correct : [String(correct ?? '')];
    const match = accepted.some((ans) => String(ans).trim().toLowerCase() === normSub);
    return { isCorrect: match, isPoll: false };
  }

  return { isCorrect: false, isPoll: false };
}

/**
 * Authoritative server-side score calculation.
 * points = basePoints * (0.5 + 0.5 * timeLeft / timeLimit)
 * Streak bonus: +10% per consecutive correct answer, capped at +50%
 */
export function calculateScore({
  question,
  submittedAnswer,
  receivedAt,
  startedAt,
  endsAt,
  currentStreak,
  settings = {},
  doublePointsActive = false,
}) {
  const { isCorrect, isPoll } = evaluateAnswer(question, submittedAnswer);
  const responseMs = Math.max(0, receivedAt - startedAt);

  if (isPoll) {
    return {
      isCorrect: false,
      isPoll: true,
      pointsEarned: 0,
      newStreak: currentStreak,
      responseMs,
    };
  }

  const basePoints = getBasePoints(question.points_mode);
  if (basePoints === 0) {
    return {
      isCorrect,
      isPoll: false,
      pointsEarned: 0,
      newStreak: isCorrect ? currentStreak + 1 : 0,
      responseMs,
    };
  }

  if (!isCorrect) {
    const penalty = settings.negativeMarking
      ? -Math.round(basePoints * (settings.negativePenaltyRatio || 0.25))
      : 0;
    return {
      isCorrect: false,
      isPoll: false,
      pointsEarned: penalty,
      newStreak: 0,
      responseMs,
    };
  }

  const timeLimitSec = Math.max(1, question.time_limit || 20);
  const timeLeftSec = Math.max(0, Math.min(timeLimitSec, (endsAt - receivedAt) / 1000));
  const speedPoints = basePoints * (0.5 + 0.5 * (timeLeftSec / timeLimitSec));

  const newStreak = currentStreak + 1;
  const streakMultiplier = 1 + Math.min(0.5, (newStreak - 1) * 0.1);
  const powerMultiplier = doublePointsActive ? 2 : 1;

  const pointsEarned = Math.round(speedPoints * streakMultiplier * powerMultiplier);

  return {
    isCorrect: true,
    isPoll: false,
    pointsEarned,
    newStreak,
    responseMs,
  };
}

export function sortLeaderboard(players) {
  return [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.totalResponseMs !== b.totalResponseMs) return a.totalResponseMs - b.totalResponseMs;
    return a.nickname.localeCompare(b.nickname);
  });
}
