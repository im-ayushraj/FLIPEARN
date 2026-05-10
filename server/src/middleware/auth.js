import { createClerkClient, verifyToken } from '@clerk/express';
import User from '../models/User.js';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Verifies the Bearer token, attaches req.auth = { userId }.
 * Also auto-upserts the user into Supabase on first API call —
 * this covers users who existed in Clerk before the webhook was set up.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES
        ? process.env.CLERK_AUTHORIZED_PARTIES.split(',').map((v) => v.trim()).filter(Boolean)
        : undefined,
    });

    const userId = payload.sub;
    req.auth = { userId };

    // Keep request auth successful even if Clerk user sync fails transiently.
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? '';
      const name  = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'User';

      await User.findOneAndUpdate(
        { _id: userId },
        { $set: { email, name, image: clerkUser.imageUrl ?? '' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (syncErr) {
      console.warn('Auth sync warning:', syncErr.message);
      await User.findOneAndUpdate(
        { _id: userId },
        { $setOnInsert: { email: '', name: 'User', image: '' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Admin-only guard — must be used AFTER requireAuth.
 * Checks publicMetadata.role === 'admin'.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await clerkClient.users.getUser(req.auth.userId);
    if (user.publicMetadata?.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });
    req.clerkUser = user;
    next();
  } catch {
    return res.status(403).json({ error: 'Forbidden' });
  }
};

export { clerkClient };
