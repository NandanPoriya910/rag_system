import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN'));

router.get('/audit', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const filter = req.query.action ? { action: String(req.query.action) } : {};
  res.json({ logs: await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean() });
}));

export default router;
