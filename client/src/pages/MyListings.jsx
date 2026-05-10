import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, TrendingUp, DollarSign,
  ListChecks, BarChart2, Eye, CheckCircle, Clock,
  XCircle, BadgeCheck, Zap, ShieldCheck, Loader2
} from 'lucide-react';
import { platformIcons } from '../assets/assets';
import Footer from '../components/Footer';
import api from '../lib/api';

const TABS = ['All', 'Active', 'Pending', 'Sold', 'Inactive'];

const statusColor = (status) => {
  switch (status) {
    case 'active':   return 'bg-green-100 text-green-600';
    case 'pending':  return 'bg-yellow-100 text-yellow-600';
    case 'sold':     return 'bg-blue-100 text-blue-600';
    default:         return 'bg-gray-100 text-gray-500';
  }
};
const statusIcon = (s) => s === 'active' ? <CheckCircle size={12} /> : s === 'pending' ? <Clock size={12} /> : s === 'sold' ? <DollarSign size={12} /> : <XCircle size={12} />;

const MyListings = () => {
  const { user } = useUser();
  const navigate  = useNavigate();
  const currency  = import.meta.env.VITE_CURRENCY || '$';
  const isAdmin   = user?.publicMetadata?.role === 'admin';

  const [listings, setListings] = useState([]);
  const [balance,  setBalance]  = useState({ earned: 0, available: 0 });
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listRes, balRes] = await Promise.all([
        api.get(isAdmin ? '/admin/listings' : '/listings/my'),
        api.get('/user/balance'),
      ]);
      setListings(listRes.data);
      setBalance(balRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [isAdmin]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/listings/${id}`);
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = activeTab === 'All'
    ? listings
    : listings.filter(l => l.status?.toLowerCase() === activeTab.toLowerCase());

  const stats = [
    { label: 'Total Listings',     value: listings.length,                               icon: <ListChecks size={20} className="text-indigo-500" />, bg: 'bg-indigo-50' },
    { label: 'Active Listings',    value: listings.filter(l => l.status === 'active').length, icon: <BarChart2 size={20} className="text-green-500" />,  bg: 'bg-green-50' },
    { label: 'Total Earned',       value: `${currency}${balance.earned.toLocaleString()}`,     icon: <TrendingUp size={20} className="text-purple-500" />, bg: 'bg-purple-50' },
    { label: 'Available Balance',  value: `${currency}${balance.available.toLocaleString()}`,  icon: <DollarSign size={20} className="text-yellow-500" />,bg: 'bg-yellow-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 md:px-16 lg:px-24 xl:px-32 py-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">My Listings</h1>
            <p className="text-sm text-gray-500 mt-1">{isAdmin ? 'Admin view — all platform listings.' : 'Manage your social media accounts listed for sale.'}</p>
          </div>
          <button onClick={() => navigate('/create-listing')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
            <Plus size={16} /> New Listing
          </button>
        </div>
        {isAdmin && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
            <ShieldCheck size={13} /> Admin — viewing all {listings.length} platform listings
          </div>
        )}
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`${s.bg} rounded-xl p-2.5`}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-gray-800 mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
              {tab !== 'All' && <span className="ml-1.5 text-xs text-gray-400">({listings.filter(l => l.status?.toLowerCase() === tab.toLowerCase()).length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="text-indigo-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <EmptyListings onCreate={() => navigate('/create-listing')} />
        ) : (
          <div className="space-y-4">
            {filtered.map(listing => (
              <ListingRow
                key={listing.id} listing={listing} currency={currency}
                onEdit={() => navigate(`/edit-listing/${listing.id}`)}
                onDelete={() => handleDelete(listing.id)}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const ListingRow = ({ listing, currency, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 h-32 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
          {listing.images?.[0] && !imgError ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">{platformIcons[listing.platform]}</div>
          )}
        </div>
        <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              {platformIcons[listing.platform]}
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{listing.title}</h3>
                <p className="text-sm text-gray-500">@{listing.username} · <span className="capitalize">{listing.platform}</span></p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor(listing.status)}`}>{statusIcon(listing.status)} {listing.status}</span>
              <span className="text-xs font-medium bg-pink-50 text-pink-600 px-2.5 py-1 rounded-full capitalize border border-pink-100">{listing.niche}</span>
              {listing.verified  && <span className="flex items-center gap-1 text-xs font-medium bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-100"><BadgeCheck size={11} /> Verified</span>}
              {listing.monetized && <span className="flex items-center gap-1 text-xs font-medium bg-yellow-50 text-yellow-600 px-2 py-1 rounded-full border border-yellow-100"><Zap size={11} /> Monetized</span>}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Eye size={12} /> {listing.followers_count?.toLocaleString()} followers</span>
              {listing.engagement_rate && <span className="flex items-center gap-1"><BarChart2 size={12} /> {listing.engagement_rate}% engagement</span>}
              {listing.country && <span>{listing.country}</span>}
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-3">
            <div className="text-right">
              <p className="text-xl font-bold text-gray-800">{currency}{listing.price?.toLocaleString()}</p>
              <p className="text-xs text-gray-400">asking price</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:border-indigo-300 hover:text-indigo-600 transition"><Edit2 size={13} /> Edit</button>
              <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 border border-red-100 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50 transition"><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyListings = ({ onCreate }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-dashed border-gray-200">
    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><ListChecks size={24} className="text-indigo-400" /></div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1">No listings yet</h3>
    <p className="text-sm text-gray-500 mb-5 max-w-xs">Start selling your social media accounts and earn money.</p>
    <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl font-semibold hover:bg-indigo-700 transition">
      <Plus size={15} /> Create your first listing
    </button>
  </div>
);

export default MyListings;
