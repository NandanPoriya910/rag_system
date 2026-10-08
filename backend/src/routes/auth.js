import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { audit } from '../utils/audit.js';
import { toPrincipal } from '../security/acl.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again in a few minutes.' } });

const publicUser = (u) => ({ id: String(u._id), username: u.username, email: u.email || '', name: u.name, role: u.role, department: u.department });
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

router.post('/login', limiter, asyncHandler(async (req, res) => {
  const identifier = String(req.body.identifier ?? req.body.username ?? req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  if (!identifier || !password) throw new HttpError(400, 'Enter your username/email and password.');

  const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
  const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH); // constant-ish time
  if (!user || !ok || !user.isActive) throw new HttpError(401, 'Invalid username/email or password.');

  await audit(toPrincipal(user), 'login');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

// Self-signup always creates the least-privileged role. Admins can't be created this way.
router.post('/signup', limiter, asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2) throw new HttpError(400, 'Please enter your name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (await User.findOne({ email })) throw new HttpError(409, 'An account with this email already exists.');

  let username = email.split('@')[0].replace(/[^a-z0-9._-]/g, '').slice(0, 30) || 'user';
  if (await User.findOne({ username })) username = `${username}${Math.floor(1000 + Math.random() * 9000)}`;

  const user = await User.create({
    username, email, name,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'EMPLOYEE',
    department: 'General',
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user: publicUser(user) });
}));

router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword = '', newPassword = '' } = req.body;
  if (String(newPassword).length < 8) throw new HttpError(400, 'New password must be at least 8 characters.');
  const user = await User.findById(req.user.id);
  if (!(await bcrypt.compare(String(currentPassword), user.passwordHash))) throw new HttpError(401, 'Current password is incorrect.');
  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await user.save();
  res.json({ ok: true });
}));

export default router;
