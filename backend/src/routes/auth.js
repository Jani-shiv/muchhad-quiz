import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { signHostToken, requireHostAuth } from '../middleware/auth.js';
import { sanitizeText } from '../middleware/sanitize.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const email = sanitizeText(req.body.email, 255).toLowerCase();
    const password = String(req.body.password || '');
    const displayName = sanitizeText(req.body.displayName || email.split('@')[0], 100);

    if (!email || !email.includes('@') || password.length < 6) {
      return res.status(400).json({ error: 'Valid email and password (min 6 chars) required.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at`,
      [email, passwordHash, displayName]
    );

    const user = rows[0];
    const token = signHostToken(user);
    return res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const email = sanitizeText(req.body.email, 255).toLowerCase();
    const password = String(req.body.password || '');

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signHostToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', requireHostAuth, async (req, res) => {
  return res.json({
    user: {
      id: req.hostUser.sub,
      email: req.hostUser.email,
      displayName: req.hostUser.displayName,
    },
  });
});

export default router;
