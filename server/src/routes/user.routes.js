import { Router } from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/* ─── Clerk Webhook ─────────────────────────────────────────
   Syncs Clerk users into your PostgreSQL database.
   Must be registered BEFORE express.json() in index.js
   so the raw body is preserved for signature verification.
─────────────────────────────────────────────────────────── */
router.post('/webhooks/clerk', async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'Webhook secret not configured' });

  const wh = new Webhook(secret);
  let evt;

  try {
    evt = wh.verify(req.body, {
      'svix-id':        req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    });
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { id, email_addresses, first_name, last_name, image_url } = evt.data;
  const email = email_addresses?.[0]?.email_address ?? '';
  const name  = `${first_name ?? ''} ${last_name ?? ''}`.trim() || 'User';

  try {
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      await User.findOneAndUpdate(
        { _id: id },
        { $set: { email, name, image: image_url ?? '' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`User ${evt.type}: ${email}`);
    }
    if (evt.type === 'user.deleted') {
      await User.findByIdAndDelete(id).catch(() => {});
      console.log(`User deleted: ${id}`);
    }
  } catch (err) {
    console.error('DB error in webhook:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }

  res.json({ received: true });
});

/* ─── GET /api/user/me ──────────────────────────────────────
   Returns current user's profile + balance from our DB.
─────────────────────────────────────────────────────────── */
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth.userId)
    .select('_id email name image earned withdrawn createdAt')
    .lean();
  if (!user) return res.status(404).json({ error: 'User not found in database. Please sign out and sign in again.' });
  
  // To match frontend expectations, ensure 'id' is available
  user.id = user._id;

  res.json({
    ...user,
    available: user.earned - user.withdrawn,
  });
});

/* ─── GET /api/user/balance ─────────────────────────────────
   Lightweight endpoint — only balance info.
─────────────────────────────────────────────────────────── */
router.get('/balance', requireAuth, async (req, res) => {
  const user = await User.findById(req.auth.userId)
    .select('earned withdrawn')
    .lean();
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    earned:    user.earned,
    withdrawn: user.withdrawn,
    available: user.earned - user.withdrawn,
  });
});

export default router;
