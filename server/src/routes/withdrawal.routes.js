import { Router } from 'express';
import User from '../models/User.js';
import { Withdrawal } from '../models/Finance.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* ─── POST /api/withdrawal ──────────────────────────────────
   Request a withdrawal of available balance.
─────────────────────────────────────────────────────────── */
router.post('/', requireAuth, async (req, res) => {
  const { amount, account } = req.body;
  // account = [{ name: 'UPI ID', value: 'user@upi' }, ...]

  if (!amount || !account?.length)
    return res.status(400).json({ error: 'Amount and account details are required' });

  const user = await User.findById(req.auth.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const available = user.earned - user.withdrawn;
  if (Number(amount) > available)
    return res.status(400).json({ error: `Insufficient balance. Available: ${available}` });
  if (Number(amount) < 10)
    return res.status(400).json({ error: 'Minimum withdrawal amount is $10' });

  const withdrawal = await Withdrawal.create({
    userId:  req.auth.userId,
    amount:  Number(amount),
    account, // JSON array
  });

  const populatedWithdrawal = await Withdrawal.findById(withdrawal._id)
    .populate('userId', 'name email image')
    .lean();

  res.status(201).json({ ...populatedWithdrawal, id: populatedWithdrawal._id });
});

/* ─── GET /api/withdrawal/my ────────────────────────────────
   Get current user's withdrawal history.
─────────────────────────────────────────────────────────── */
router.get('/my', requireAuth, async (req, res) => {
  const withdrawals = await Withdrawal.find({ userId: req.auth.userId })
    .sort({ createdAt: -1 })
    .lean();
  res.json(withdrawals.map(w => ({ ...w, id: w._id })));
});

export default router;
