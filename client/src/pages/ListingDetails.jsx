import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BadgeCheck, User, LineChart, MapPin, ArrowLeft,
  Eye, ShieldCheck, Zap, Star, Globe, Calendar,
  MessageCircle, ShoppingCart, X, ChevronLeft, ChevronRight,
  ExternalLink
} from 'lucide-react';
import { platformIcons, getProfileLink } from '../assets/assets';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import { useClerk, useUser } from '@clerk/clerk-react';
import api from '../lib/api';

const ListingDetails = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const currency = import.meta.env.VITE_CURRENCY || '$';

  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get(`/listings/${listingId}`);
        setListing(data);
        setActiveImage(0);

        const all = await api.get('/listings', {
          params: { platform: data.platform },
        });

        setRelated(all.data.filter((l) => l.id !== data.id).slice(0, 3));
      } catch (err) {
        setError(err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Loading listing...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <Eye size={24} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Listing not found</h2>
        <p className="text-gray-500 text-sm mb-5">{error || "This listing may have been removed or doesn't exist."}</p>
        <button onClick={() => navigate('/marketplace')} className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm">
          Back to Marketplace
        </button>
      </div>
    );
  }

  const openLightbox = (i) => { setLightboxIndex(i); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const prevImage = () => setLightboxIndex(i => (i - 1 + listing.images.length) % listing.images.length);
  const nextImage = () => setLightboxIndex(i => (i + 1) % listing.images.length);

  const handleBuy = () => { if (!user) { openSignIn(); return; } /* future: initiate checkout */ };
  const handleMessage = () => { if (!user) { openSignIn(); return; } navigate('/messages'); };

  const profileLink = getProfileLink(listing.platform, listing.username);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back bar */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-16 lg:px-24 xl:px-32 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-8">
        {/* Featured Banner */}
        {listing.featured && (
          <div className="mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            <Star size={12} fill="white" /> Featured Listing
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8">
          {/* LEFT — Images + Details */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Image Gallery */}
            {listing.images && listing.images.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Main Image */}
                <div
                  className="relative aspect-video overflow-hidden cursor-zoom-in"
                  onClick={() => openLightbox(activeImage)}
                >
                  <img
                    src={listing.images[activeImage]}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                    {activeImage + 1} / {listing.images.length}
                  </span>
                </div>
                {/* Thumbnails */}
                <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
                  {listing.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${activeImage === i ? 'border-indigo-500' : 'border-transparent'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Platform + Title + Badges */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{platformIcons[listing.platform]}</div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-800 leading-snug">{listing.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {profileLink ? (
                      <a href={profileLink} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                        @{listing.username} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">@{listing.username}</span>
                    )}
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-500 capitalize">{listing.platform}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {listing.verified && (
                      <span className="flex items-center gap-1 text-xs font-medium bg-green-50 text-green-600 px-2.5 py-1 rounded-full border border-green-100">
                        <BadgeCheck size={12} /> Verified
                      </span>
                    )}
                    {listing.monetized && (
                      <span className="flex items-center gap-1 text-xs font-medium bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-full border border-yellow-100">
                        <Zap size={12} /> Monetized
                      </span>
                    )}
                    {listing.platformAssured && (
                      <span className="flex items-center gap-1 text-xs font-medium bg-cyan-50 text-cyan-600 px-2.5 py-1 rounded-full border border-cyan-100">
                        <ShieldCheck size={12} /> Platform Assured
                      </span>
                    )}
                    <span className="text-xs font-medium bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full border border-pink-100 capitalize">
                      {listing.niche}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Account Statistics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard icon={<User size={18} className="text-indigo-500" />} label="Followers" value={listing.followers_count?.toLocaleString()} />
                {listing.engagement_rate != null && (
                  <StatCard icon={<LineChart size={18} className="text-purple-500" />} label="Engagement Rate" value={`${listing.engagement_rate}%`} />
                )}
                {listing.monthly_views != null && (
                  <StatCard icon={<Eye size={18} className="text-blue-500" />} label="Monthly Views" value={listing.monthly_views?.toLocaleString()} />
                )}
                {listing.country && (
                  <StatCard icon={<MapPin size={18} className="text-pink-500" />} label="Country" value={listing.country} />
                )}
                {listing.age_range && (
                  <StatCard icon={<Globe size={18} className="text-teal-500" />} label="Age Range" value={listing.age_range} />
                )}
                <StatCard icon={<Calendar size={18} className="text-orange-500" />} label="Listed" value={new Date(listing.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-800 mb-3">About this Account</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
              </div>
            )}

            {/* Owner */}
            {listing.owner && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Seller Information</h2>
                <div className="flex items-center gap-4">
                  <img src={listing.owner.image} alt={listing.owner.name} className="size-12 rounded-full object-cover border-2 border-indigo-100" />
                  <div>
                    <p className="font-medium text-gray-800">{listing.owner.name}</p>
                    {listing.owner.email && <p className="text-sm text-gray-500">{listing.owner.email}</p>}
                    {listing.owner.createdAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Member since {new Date(listing.owner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Sticky Price Card */}
          <div className="xl:w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-gray-800">{currency}{listing.price?.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mb-5">One-time purchase · Full transfer included</p>

                <div className="space-y-3">
                  <button
                    onClick={handleBuy}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} /> Buy Now
                  </button>
                  <button
                    onClick={handleMessage}
                    className="w-full py-3 border border-indigo-200 text-indigo-600 rounded-xl font-semibold text-sm hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} /> Message Seller
                  </button>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <ShieldCheck size={13} className="text-green-500" /> Buyer protection guaranteed
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <BadgeCheck size={13} className="text-indigo-500" /> Secure credential transfer
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Zap size={13} className="text-yellow-500" /> Instant access after payment
                  </div>
                </div>
              </div>

              {/* Listing Status */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Status</p>
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                  listing.status === 'active' ? 'bg-green-100 text-green-600' :
                  listing.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  listing.status === 'sold' ? 'bg-gray-100 text-gray-500' :
                  'bg-red-100 text-red-500'
                }`}>
                  {listing.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">More {listing.platform} accounts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={24} /></button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 text-white/70 hover:text-white p-2">
            <ChevronLeft size={32} />
          </button>
          <img
            src={listing.images[lightboxIndex]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 text-white/70 hover:text-white p-2">
            <ChevronRight size={32} />
          </button>
          <p className="absolute bottom-5 text-white/60 text-sm">{lightboxIndex + 1} / {listing.images.length}</p>
        </div>
      )}

      <Footer />
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50 border border-gray-100">
    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">{icon} {label}</div>
    <p className="text-base font-semibold text-gray-800">{value}</p>
  </div>
);

export default ListingDetails;
