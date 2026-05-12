import { Router } from 'express';
import multer from 'multer';
import Listing from '../models/Listing.js';
import { Credential } from '../models/Finance.js';
import { uploadBuffer } from '../lib/cloudinary.js';
import { requireAuth } from '../middleware/auth.js';

const router  = Router();
const upload  = multer({
  storage: multer.memoryStorage(),
  limits:  { files: 4, fileSize: 5 * 1024 * 1024 }, // 4 files, 5MB each
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
});

/* ─── GET /api/listings ─────────────────────────────────────
   Public — fetch all active listings with optional filters.
   Query params: platform, niche, minPrice, maxPrice,
                 verified, monetized, search, sort
─────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  const { platform, niche, minPrice, maxPrice, verified, monetized, search, sort } = req.query;

  const where = {
    status: 'active',
    ...(platform  && { platform }),
    ...(niche     && { niche }),
    ...(verified  === 'true' && { verified: true }),
    ...(monetized === 'true' && { monetized: true }),
    ...((minPrice || maxPrice) && {
      price: {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      },
    }),
    ...(search && {
      $or: [
        { title:    { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ],
    }),
  };

  const orderBy = (() => {
    switch (sort) {
      case 'price_asc':      return { price: 1 };
      case 'price_desc':     return { price: -1 };
      case 'followers_desc': return { followers_count: -1 };
      default:               return { featured: -1, createdAt: -1 };
    }
  })();

  const listings = await Listing.find(where)
    .sort(orderBy)
    .populate('ownerId', 'name image email createdAt')
    .lean();

  const formattedListings = listings.map(l => ({
    ...l,
    id: l._id,
    owner: l.ownerId
      ? {
          id: l.ownerId._id,
          name: l.ownerId.name,
          image: l.ownerId.image,
          email: l.ownerId.email,
          createdAt: l.ownerId.createdAt,
        }
      : null
  }));

  res.json(formattedListings);
});

/* ─── GET /api/listings/my ──────────────────────────────────
   Protected — get only the signed-in user's listings.
   NOTE: must be defined BEFORE /:id to avoid conflicts.
─────────────────────────────────────────────────────────── */
router.get('/my', requireAuth, async (req, res) => {
  const listings = await Listing.find({ 
    ownerId: req.auth.userId, 
    $or: [{ status: 'active' }, { status: 'inactive' }, { status: 'sold' }] 
  })
    .sort({ createdAt: -1 })
    .lean();
    
  res.json(listings.map(l => ({ ...l, id: l._id })));
});

/* ─── GET /api/listings/:id ─────────────────────────────────
   Public — get single listing with owner info.
─────────────────────────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate('ownerId', 'name image email createdAt')
    .lean();

  if (!listing || listing.status === 'deleted')
    return res.status(404).json({ error: 'Listing not found' });
    
  res.json({
    ...listing,
    id: listing._id,
    owner: listing.ownerId
      ? {
          id: listing.ownerId._id,
          name: listing.ownerId.name,
          image: listing.ownerId.image,
          email: listing.ownerId.email,
          createdAt: listing.ownerId.createdAt,
        }
      : null
  });
});

/* ─── POST /api/listings ────────────────────────────────────
   Protected — create a new listing (with optional image upload).
─────────────────────────────────────────────────────────── */
router.post('/', requireAuth, upload.array('images', 4), async (req, res) => {
  // Upload images to Cloudinary
  const imageUrls = await Promise.all(
    (req.files || []).map(f => uploadBuffer(f.buffer))
  );

  const {
    title, platform, username, niche,
    followers_count, engagement_rate, monthly_views,
    age_range, country, price, description,
    monetized, featured, originalCredential,
  } = req.body;

  // Parse credentials
  let parsedCredentials = [];
  if (originalCredential) {
    try {
      parsedCredentials = JSON.parse(originalCredential);
      if (!Array.isArray(parsedCredentials)) parsedCredentials = [];
    } catch (err) {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }
  }

  if (parsedCredentials.length === 0) {
    return res.status(400).json({ error: 'At least one credential is required' });
  }

  const listing = await Listing.create({
    ownerId:         req.auth.userId,
    title,
    platform,
    username:        username || null,
    niche,
    followers_count: Number(followers_count),
    engagement_rate: engagement_rate ? Number(engagement_rate) : null,
    monthly_views:   monthly_views   ? Number(monthly_views)   : null,
    age_range,
    country:         country      || null,
    price:           Number(price),
    description:     description  || null,
    monetized:       monetized === 'true',
    featured:        featured  === 'true',
    images:          imageUrls,
  });

  // Create credential record
  await Credential.create({
    listingId: listing._id,
    originalCredential: parsedCredentials,
  });

  res.status(201).json({ ...listing.toObject(), id: listing._id });
});

/* ─── PUT /api/listings/:id ─────────────────────────────────
   Protected — update a listing (owner only).
─────────────────────────────────────────────────────────── */
router.put('/:id', requireAuth, upload.array('images', 4), async (req, res) => {
  const existing = await Listing.findById(req.params.id);
  if (!existing)                               return res.status(404).json({ error: 'Listing not found' });
  if (existing.ownerId !== req.auth.userId)    return res.status(403).json({ error: 'Forbidden — not your listing' });

  let retainedImages = existing.images;
  if (req.body.existingImages) {
    try {
      const parsed = JSON.parse(req.body.existingImages);
      if (Array.isArray(parsed)) retainedImages = parsed;
    } catch {
      retainedImages = existing.images;
    }
  }

  // Keep retained images and append newly uploaded ones.
  let imageUrls = retainedImages;
  if (req.files?.length) {
    const uploaded = await Promise.all(req.files.map(f => uploadBuffer(f.buffer)));
    imageUrls = [...retainedImages, ...uploaded].slice(0, 4);
  }

  const {
    title, platform, username, niche,
    followers_count, engagement_rate, monthly_views,
    age_range, country, price, description, monetized,
  } = req.body;

  const updated = await Listing.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title,
        platform,
        username:        username  || null,
        niche,
        followers_count: Number(followers_count),
        engagement_rate: engagement_rate ? Number(engagement_rate) : null,
        monthly_views:   monthly_views   ? Number(monthly_views)   : null,
        age_range,
        country:         country     || null,
        price:           Number(price),
        description:     description || null,
        monetized:       monetized === 'true',
        images:          imageUrls,
      }
    },
    { new: true }
  ).lean();

  res.json({ ...updated, id: updated._id });
});

/* ─── DELETE /api/listings/:id ──────────────────────────────
   Protected — soft-delete (status → 'deleted'), owner only.
─────────────────────────────────────────────────────────── */
router.delete('/:id', requireAuth, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing)                             return res.status(404).json({ error: 'Listing not found' });
  if (listing.ownerId !== req.auth.userId)  return res.status(403).json({ error: 'Forbidden' });

  await Listing.findByIdAndUpdate(req.params.id, { $set: { status: 'deleted' } });
  res.json({ success: true });
});

export default router;
