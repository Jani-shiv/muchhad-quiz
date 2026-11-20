import express from 'express';
import { pool, query } from '../config/db.js';
import { requireHostAuth } from '../middleware/auth.js';
import { sanitizeText, sanitizeUrl } from '../middleware/sanitize.js';

const router = express.Router();
router.use(requireHostAuth);

const VALID_TYPES = new Set(['single_choice', 'multiple_choice', 'true_false', 'type_answer', 'poll']);
const VALID_POINTS = new Set(['standard', 'double', 'none']);

function normalizeQuestion(q, idx) {
  const type = VALID_TYPES.has(q.type) ? q.type : 'single_choice';
  const timeLimit = Math.min(120, Math.max(5, parseInt(q.timeLimit ?? q.time_limit ?? 20, 10) || 20));
  const pointsMode = type === 'poll' ? 'none' : (VALID_POINTS.has(q.pointsMode ?? q.points_mode) ? (q.pointsMode ?? q.points_mode) : 'standard');
  const text = sanitizeText(q.text || '', 500) || `Question ${idx + 1}`;
  const imageUrl = sanitizeUrl(q.imageUrl ?? q.image_url ?? '');

  let options = Array.isArray(q.options) ? q.options.slice(0, 6).map((o) => sanitizeText(String(o), 200)) : [];
  if (type === 'true_false') {
    options = ['True', 'False'];
  } else if (type === 'type_answer') {
    options = [];
  } else if (options.length < 2) {
    options = ['Option A', 'Option B', 'Option C', 'Option D'];
  }

  let correctAnswer = q.correctAnswer ?? q.correct_answer ?? 0;
  if (type === 'poll') {
    correctAnswer = null;
  } else if (type === 'multiple_choice') {
    const arr = Array.isArray(correctAnswer) ? correctAnswer : [0];
    correctAnswer = [...new Set(arr.map((n) => parseInt(n, 10)).filter((n) => n >= 0 && n < options.length))];
    if (correctAnswer.length === 0) correctAnswer = [0];
  } else if (type === 'type_answer') {
    const accepted = Array.isArray(correctAnswer)
      ? correctAnswer.map((s) => sanitizeText(String(s), 120)).filter(Boolean)
      : [sanitizeText(String(correctAnswer || ''), 120)].filter(Boolean);
    correctAnswer = accepted.length ? accepted : ['answer'];
  } else {
    const idxVal = parseInt(correctAnswer, 10);
    correctAnswer = Number.isInteger(idxVal) && idxVal >= 0 && idxVal < options.length ? idxVal : 0;
  }

  return { sortOrder: idx, type, text, imageUrl, options, correctAnswer, timeLimit, pointsMode };
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT q.*, COALESCE(COUNT(qs.id), 0)::int AS question_count
       FROM quizzes q
       LEFT JOIN questions qs ON qs.quiz_id = q.id
       WHERE q.host_id = $1
       GROUP BY q.id
       ORDER BY q.updated_at DESC`,
      [req.hostUser.sub]
    );
    return res.json({ quizzes: rows });
  } catch (err) {
    console.error('[Quizzes] List error:', err);
    return res.status(500).json({ error: 'Failed to load quizzes.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quizRes = await query('SELECT * FROM quizzes WHERE id = $1 AND host_id = $2', [
      req.params.id,
      req.hostUser.sub,
    ]);
    if (quizRes.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    const qRes = await query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY sort_order ASC',
      [req.params.id]
    );
    return res.json({ quiz: quizRes.rows[0], questions: qRes.rows });
  } catch (err) {
    console.error('[Quizzes] Get error:', err);
    return res.status(500).json({ error: 'Failed to load quiz.' });
  }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const title = sanitizeText(req.body.title || 'Untitled Quiz', 200) || 'Untitled Quiz';
    const description = sanitizeText(req.body.description || '', 1000);
    const settings = {
      negativeMarking: Boolean(req.body.settings?.negativeMarking),
      negativePenaltyRatio: Number(req.body.settings?.negativePenaltyRatio ?? 0.25),
      allowAnswerChange: Boolean(req.body.settings?.allowAnswerChange),
      enablePowerUps: req.body.settings?.enablePowerUps !== false,
      enableReactions: req.body.settings?.enableReactions !== false,
    };
    const rawQuestions = Array.isArray(req.body.questions) ? req.body.questions : [];

    await client.query('BEGIN');
    const quizRes = await client.query(
      `INSERT INTO quizzes (host_id, title, description, settings)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.hostUser.sub, title, description, JSON.stringify(settings)]
    );
    const quiz = quizRes.rows[0];

    const insertedQuestions = [];
    for (let i = 0; i < rawQuestions.length; i++) {
      const nq = normalizeQuestion(rawQuestions[i], i);
      const qr = await client.query(
        `INSERT INTO questions (quiz_id, sort_order, type, text, image_url, options, correct_answer, time_limit, points_mode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          quiz.id,
          nq.sortOrder,
          nq.type,
          nq.text,
          nq.imageUrl,
          JSON.stringify(nq.options),
          JSON.stringify(nq.correctAnswer),
          nq.timeLimit,
          nq.pointsMode,
        ]
      );
      insertedQuestions.push(qr.rows[0]);
    }
    await client.query('COMMIT');
    return res.status(201).json({ quiz, questions: insertedQuestions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Quizzes] Create error:', err);
    return res.status(500).json({ error: 'Failed to create quiz.' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM quizzes WHERE id = $1 AND host_id = $2', [
      req.params.id,
      req.hostUser.sub,
    ]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    const title = sanitizeText(req.body.title || 'Untitled Quiz', 200) || 'Untitled Quiz';
    const description = sanitizeText(req.body.description || '', 1000);
    const settings = {
      negativeMarking: Boolean(req.body.settings?.negativeMarking),
      negativePenaltyRatio: Number(req.body.settings?.negativePenaltyRatio ?? 0.25),
      allowAnswerChange: Boolean(req.body.settings?.allowAnswerChange),
      enablePowerUps: req.body.settings?.enablePowerUps !== false,
      enableReactions: req.body.settings?.enableReactions !== false,
    };
    const rawQuestions = Array.isArray(req.body.questions) ? req.body.questions : [];

    await client.query('BEGIN');
    const quizRes = await client.query(
      `UPDATE quizzes SET title = $1, description = $2, settings = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [title, description, JSON.stringify(settings), req.params.id]
    );
    await client.query('DELETE FROM questions WHERE quiz_id = $1', [req.params.id]);

    const insertedQuestions = [];
    for (let i = 0; i < rawQuestions.length; i++) {
      const nq = normalizeQuestion(rawQuestions[i], i);
      const qr = await client.query(
        `INSERT INTO questions (quiz_id, sort_order, type, text, image_url, options, correct_answer, time_limit, points_mode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          req.params.id,
          nq.sortOrder,
          nq.type,
          nq.text,
          nq.imageUrl,
          JSON.stringify(nq.options),
          JSON.stringify(nq.correctAnswer),
          nq.timeLimit,
          nq.pointsMode,
        ]
      );
      insertedQuestions.push(qr.rows[0]);
    }
    await client.query('COMMIT');
    return res.json({ quiz: quizRes.rows[0], questions: insertedQuestions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Quizzes] Update error:', err);
    return res.status(500).json({ error: 'Failed to update quiz.' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM quizzes WHERE id = $1 AND host_id = $2 RETURNING id', [
      req.params.id,
      req.hostUser.sub,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    return res.json({ deleted: true });
  } catch (err) {
    console.error('[Quizzes] Delete error:', err);
    return res.status(500).json({ error: 'Failed to delete quiz.' });
  }
});

export default router;
