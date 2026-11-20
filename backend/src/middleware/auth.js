import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signHostToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, displayName: user.display_name, role: 'host' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export function verifyHostToken(token) {
  const payload = jwt.verify(token, env.jwtSecret);
  if (payload.role !== 'host') {
    throw new Error('Invalid role');
  }
  return payload;
}

export function requireHostAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);
  try {
    req.hostUser = verifyHostToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
