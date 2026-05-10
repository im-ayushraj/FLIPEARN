import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  ownerId: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  platform: { 
    type: String, 
    enum: ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin', 'pinterest', 'snapchat', 'twitch', 'discord'],
    required: true 
  },
  username: { type: String },
  followers_count: { type: Number, required: true },
  engagement_rate: { type: Number },
  monthly_views: { type: Number },
  niche: { 
    type: String, 
    enum: ['lifestyle', 'fitness', 'food', 'travel', 'tech', 'gaming', 'fashion', 'beauty', 'business', 'education', 'entertainment', 'music', 'art', 'sports', 'health', 'finance', 'other'],
    required: true 
  },
  price: { type: Number, required: true },
  description: { type: String },
  verified: { type: Boolean, default: false },
  monetized: { type: Boolean, default: false },
  country: { type: String },
  age_range: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'ban', 'sold', 'deleted', 'inactive'],
    default: 'active' 
  },
  featured: { type: Boolean, default: false },
  images: [{ type: String }],
  platformAssured: { type: Boolean, default: false },
  isCredentialSubmitted: { type: Boolean, default: false },
  isCredentialVerified: { type: Boolean, default: false },
  isCredentialChanged: { type: Boolean, default: false },
}, {
  timestamps: true,
});

const Listing = mongoose.model('Listing', listingSchema);
export default Listing;
