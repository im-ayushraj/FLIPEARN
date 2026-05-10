import { Router } from 'express';
import { Transaction, Withdrawal, Credential } from '../models/Finance.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { runWithOptionalTransaction } from '../lib/mongoTransaction.js';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

/* ─── GET /api/admin/dashboard ──────────────────────────────
   Platform-wide summary stats + recent listings.
─────────────────────────────────────────────────────────── */
router.get('/dashboard', async (req, res) => {
  const [
    totalListings,
    activeListings,
    totalUser,
    revenueAgg,
    recentListings,
    pendingWithdrawals,
  ] = await Promise.all([
    Listing.countDocuments({ status: { $in: ['active', 'inactive', 'sold', 'ban'] } }),
    Listing.countDocuments({ status: 'active' }),
    User.countDocuments(),
    Transaction.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Listing.find({ status: { $in: ['active', 'inactive', 'sold', 'ban'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('ownerId', 'name image email')
      .lean(),
    Withdrawal.countDocuments({ isWithdrawn: false }),
  ]);

  res.json({
    totalListings,
    activeListings,
    totalUser,
    totalRevenue:       revenueAgg[0]?.total ?? 0,
    recentListings:     recentListings.map(l => ({ ...l, id: l._id, owner: l.ownerId ? { ...l.ownerId, id: l.ownerId._id } : null })),
    pendingWithdrawals,
  });
});

/* ─── GET /api/admin/listings ───────────────────────────────
   All listings (any status) with owner info.
─────────────────────────────────────────────────────────── */
router.get('/listings', async (req, res) => {
  const listings = await Listing.find({ status: { $in: ['active', 'inactive', 'sold', 'ban'] } })
    .populate('ownerId', 'name image email')
    .sort({ createdAt: -1 })
    .lean();
  res.json(listings.map(l => ({ ...l, id: l._id, owner: l.ownerId ? { ...l.ownerId, id: l.ownerId._id } : null })));
});

/* ─── PATCH /api/admin/listings/:id/status ──────────────────
   Change a listing's status (active/inactive/ban/sold).
─────────────────────────────────────────────────────────── */
router.patch('/listings/:id/status', async (req, res) => {
  const { status } = req.body;
  const ALLOWED = ['active', 'inactive', 'ban', 'sold'];
  if (!ALLOWED.includes(status))
    return res.status(400).json({ error: `Status must be one of: ${ALLOWED.join(', ')}` });

  const updated = await Listing.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true }
  ).lean();
  res.json({ ...updated, id: updated._id });
});

/* ─── GET /api/admin/transactions ───────────────────────────
   All transactions across the platform.
─────────────────────────────────────────────────────────── */
router.get('/transactions', async (req, res) => {
  const transactions = await Transaction.find()
    .populate({
      path: 'listingId',
      select: 'title platform username price images'
    })
    .sort({ createdAt: -1 })
    .lean();
  res.json(transactions.map(t => ({ ...t, id: t._id, listing: t.listingId ? { ...t.listingId, id: t.listingId._id } : null })));
});

/* ─── GET /api/admin/withdrawals ────────────────────────────
   All withdrawal requests with user info.
─────────────────────────────────────────────────────────── */
router.get('/withdrawals', async (req, res) => {
  const withdrawals = await Withdrawal.find()
    .populate('userId', 'name email image')
    .sort({ createdAt: -1 })
    .lean();
  res.json(withdrawals.map(w => ({ ...w, id: w._id, user: w.userId ? { ...w.userId, id: w.userId._id } : null })));
});

/* ─── PATCH /api/admin/withdrawals/:id/pay ──────────────────
   Mark a withdrawal as paid and debit from user's withdrawn.
─────────────────────────────────────────────────────────── */
router.patch('/withdrawals/:id/pay', async (req, res) => {
  const w = await Withdrawal.findById(req.params.id);
  if (!w)             return res.status(404).json({ error: 'Withdrawal not found' });
  if (w.isWithdrawn)  return res.status(400).json({ error: 'Already marked as paid' });

  await runWithOptionalTransaction(async (session) => {
    const options = session ? { session } : {};
    await Withdrawal.findByIdAndUpdate(req.params.id, { $set: { isWithdrawn: true } }, options);
    await User.findByIdAndUpdate(w.userId, { $inc: { withdrawn: w.amount } }, options);
  });

  res.json({ success: true });
});

/* ─── GET /api/admin/credentials/:listingId ─────────────────
   View credentials for a specific listing.
─────────────────────────────────────────────────────────── */
router.get('/credentials/:listingId', async (req, res) => {
  const credential = await Credential.findOne({ listingId: req.params.listingId });
  if (!credential) return res.status(404).json({ error: 'No credentials submitted yet' });
  res.json({ ...credential.toObject(), id: credential._id });
});

/* ─── POST /api/admin/credentials/:listingId/verify ─────────
   Mark listing credentials as verified.
─────────────────────────────────────────────────────────── */
router.post('/credentials/:listingId/verify', async (req, res) => {
  await Listing.findByIdAndUpdate(req.params.listingId, { $set: { isCredentialVerified: true } });
  res.json({ success: true });
});

/* ─── POST /api/admin/credentials/:listingId/change ─────────
   Admin provides updated credentials after account transfer.
─────────────────────────────────────────────────────────── */
router.post('/credentials/:listingId/change', async (req, res) => {
  const { updatedCredential } = req.body;
  if (!updatedCredential?.length)
    return res.status(400).json({ error: 'updatedCredential array is required' });

  await runWithOptionalTransaction(async (session) => {
    const options = session ? { session } : {};
    await Credential.updateMany({ listingId: req.params.listingId }, { $set: { updatedCredential } }, options);
    await Listing.findByIdAndUpdate(req.params.listingId, { $set: { isCredentialChanged: true } }, options);
  });

  res.json({ success: true });
});

/* ─── POST /api/admin/credentials/:listingId/submit ─────────
   Seller submits original credentials after sale.
─────────────────────────────────────────────────────────── */
router.post('/credentials/:listingId/submit', requireAuth, async (req, res) => {
  const { originalCredential } = req.body;

  // Verify requester owns the listing
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  await runWithOptionalTransaction(async (session) => {
    const options = session ? { session } : {};
    await Credential.findOneAndUpdate(
      { listingId: req.params.listingId },
      { $set: { originalCredential } },
      { upsert: true, ...options }
    );
    await Listing.findByIdAndUpdate(req.params.listingId, { $set: { isCredentialSubmitted: true } }, options);
  });

  res.json({ success: true });
});

export default router;
