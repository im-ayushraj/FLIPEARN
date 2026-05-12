import { Router } from 'express';
import { Transaction, Credential } from '../models/Finance.js';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { runWithOptionalTransaction } from '../lib/mongoTransaction.js';
import { sendOrderConfirmationEmail } from '../lib/email.js';

const router = Router();

/* ─── GET /api/orders ───────────────────────────────────────
   Protected — buyer's purchase history.
─────────────────────────────────────────────────────────── */
router.get('/', requireAuth, async (req, res) => {
  const orders = await Transaction.find({ userId: req.auth.userId })
    .populate({
      path: 'listingId',
      populate: { path: 'ownerId', select: 'name image' }
    })
    .sort({ createdAt: -1 })
    .lean();

  // Shape response to match frontend expectations
  const shaped = orders.map(o => ({
    id:        o._id,
    amount:    o.amount,
    isPaid:    o.isPaid,
    createdAt: o.createdAt,
    listing:   o.listingId ? { ...o.listingId, id: o.listingId._id, owner: o.listingId.ownerId ? { id: o.listingId.ownerId._id, name: o.listingId.ownerId.name, image: o.listingId.ownerId.image } : null } : null,
    credential: null, // loaded separately via /credentials endpoint
  }));

  res.json(shaped);
});

/* ─── GET /api/orders/:id/credentials ──────────────────────
   Protected — reveal account credentials for a paid order.
   Only the buyer (userId) may access this.
─────────────────────────────────────────────────────────── */
router.get('/:id/credentials', requireAuth, async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction)
    return res.status(404).json({ error: 'Order not found' });
  if (transaction.userId !== req.auth.userId)
    return res.status(403).json({ error: 'Forbidden — not your order' });
  if (!transaction.isPaid)
    return res.status(402).json({ error: 'Payment not completed' });

  const credential = await Credential.findOne({ listingId: transaction.listingId });

  if (!credential)
    return res.status(404).json({ error: 'Credentials not yet submitted by seller' });

  res.json(credential);
});

/* ─── POST /api/orders/initiate ─────────────────────────────
   Protected — create a pending transaction (before payment).
   In production this would integrate with a payment gateway.
─────────────────────────────────────────────────────────── */
router.post('/initiate', requireAuth, async (req, res) => {
  const { listingId } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing || listing.status !== 'active')
    return res.status(400).json({ error: 'Listing not available for purchase' });
  if (listing.ownerId === req.auth.userId)
    return res.status(400).json({ error: 'You cannot buy your own listing' });

  // Check for existing incomplete transaction
  const existing = await Transaction.findOne({
    listingId, userId: req.auth.userId, isPaid: false
  });
  if (existing) return res.json({ ...existing.toObject(), id: existing._id });

  const transaction = await Transaction.create({
    listingId,
    ownerId:  listing.ownerId,
    userId:   req.auth.userId,
    amount:   listing.price,
    isPaid:   false,
  });

  res.status(201).json({ ...transaction.toObject(), id: transaction._id });
});

/* ─── POST /api/orders/:id/confirm ─────────────────────────
   Protected — mark a transaction as paid (called after payment).
   Also marks listing as 'sold' and credits seller.
─────────────────────────────────────────────────────────── */
router.post('/:id/confirm', requireAuth, async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction || transaction.userId !== req.auth.userId)
    return res.status(403).json({ error: 'Forbidden' });
  if (transaction.isPaid)
    return res.status(400).json({ error: 'Already paid' });

  // Platform fee — 5%
  const platformFee   = transaction.amount * 0.05;
  const sellerEarning = transaction.amount - platformFee;

  await runWithOptionalTransaction(async (session) => {
    const options = session ? { session } : {};
    await Transaction.findByIdAndUpdate(req.params.id, { $set: { isPaid: true } }, options);
    await Listing.findByIdAndUpdate(transaction.listingId, { $set: { status: 'sold' } }, options);
    await User.findByIdAndUpdate(transaction.ownerId, { $inc: { earned: sellerEarning } }, options);
  });

  const [buyer, credential, listing] = await Promise.all([
    User.findById(req.auth.userId),
    Credential.findOne({ listingId: transaction.listingId }),
    Listing.findById(transaction.listingId).lean(),
  ]);

  try {
    await sendOrderConfirmationEmail({
      buyer,
      listing,
      transaction,
      credential,
    });
  } catch (emailError) {
    console.error('Email confirmation failed:', emailError);
  }

  res.json({ success: true, message: 'Payment confirmed' });
});

export default router;
