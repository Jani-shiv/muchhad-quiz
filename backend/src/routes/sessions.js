import express from 'express';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { requireHostAuth } from '../middleware/auth.js';
import { createRoom, getRoom } from '../services/roomStore.js';

const router = express.Router();

async function generateUniquePin() {
  for (let i = 0; i < 15; i++) {
    const pin = String(crypto.randomInt(100000, 999999));
    const existing = await getRoom(pin);
    if (!existing) return pin;
  }
  throw new Error('Could not allocate unique PIN');
}

router.post('/', requireHostAuth, async (req, res) => {
  try {
    const { quizId } = req.body;
    const quizRes = await query('SELECT * FROM quizzes WHERE id = $1 AND host_id = $2', [
      quizId,
      req.hostUser.sub,
    ]);
    if (quizRes.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    const quiz = quizRes.rows[0];
    const qRes = await query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY sort_order ASC',
      [quiz.id]
    );
    if (qRes.rows.length === 0) {
      return res.status(400).json({ error: 'Add at least one question before hosting.' });
    }

    const pin = await generateUniquePin();
    const sessionRes = await query(
      `INSERT INTO game_sessions (quiz_id, host_id, pin, status)
       VALUES ($1, $2, $3, 'LOBBY') RETURNING *`,
      [quiz.id, req.hostUser.sub, pin]
    );
    const session = sessionRes.rows[0];

    await createRoom({
      pin,
      sessionId: session.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      hostId: req.hostUser.sub,
      settings: quiz.settings,
      questions: qRes.rows,
    });

    return res.status(201).json({ session, pin });
  } catch (err) {
    console.error('[Sessions] Create error:', err);
    return res.status(500).json({ error: 'Failed to create live session.' });
  }
});

router.get('/history', requireHostAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT gs.*, q.title AS quiz_title
       FROM game_sessions gs
       JOIN quizzes q ON q.id = gs.quiz_id
       WHERE gs.host_id = $1
       ORDER BY gs.created_at DESC
       LIMIT 50`,
      [req.hostUser.sub]
    );
    return res.json({ sessions: rows });
  } catch (err) {
    console.error('[Sessions] History error:', err);
    return res.status(500).json({ error: 'Failed to load session history.' });
  }
});

router.get('/:id/results', requireHostAuth, async (req, res) => {
  try {
    const sRes = await query(
      `SELECT gs.*, q.title AS quiz_title
       FROM game_sessions gs
       JOIN quizzes q ON q.id = gs.quiz_id
       WHERE gs.id = $1 AND gs.host_id = $2`,
      [req.params.id, req.hostUser.sub]
    );
    if (sRes.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const rRes = await query(
      `SELECT * FROM session_results WHERE session_id = $1 ORDER BY final_rank ASC`,
      [req.params.id]
    );
    return res.json({ session: sRes.rows[0], results: rRes.rows });
  } catch (err) {
    console.error('[Sessions] Results error:', err);
    return res.status(500).json({ error: 'Failed to load results.' });
  }
});

export default router;
