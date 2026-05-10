import React, { useState, useEffect } from 'react';
import { platformIcons } from '../assets/assets';
import { ShoppingBag, DollarSign, Eye, EyeOff, X, ShieldCheck, CheckCircle2, Calendar, KeyRound, Lock, Loader2 } from 'lucide-react';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const currency = import.meta.env.VITE_CURRENCY || '$';
  const navigate  = useNavigate();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    api.get('/orders')
      .then(r => setOrders(r.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = orders.reduce((acc, o) => acc + (o.isPaid ? o.amount : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 md:px-16 lg:px-24 xl:px-32 py-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">My Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Track your purchases and access credentials for accounts you've bought.</p>
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl">
          <StatCard icon={<ShoppingBag size={20} className="text-indigo-500" />} bg="bg-indigo-50" label="Total Orders"  value={orders.length} />
          <StatCard icon={<DollarSign  size={20} className="text-green-500"  />} bg="bg-green-50"  label="Total Spent"   value={`${currency}${totalSpent.toLocaleString()}`} />
          <StatCard icon={<CheckCircle2 size={20} className="text-blue-500"  />} bg="bg-blue-50"   label="Completed"     value={orders.filter(o => o.isPaid).length} />
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 size={28} className="text-indigo-400 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <ShoppingBag size={32} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-400 mb-5">Browse the marketplace to find accounts.</p>
            <button onClick={() => navigate('/marketplace')} className="px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-xl font-medium hover:bg-indigo-700 transition">Browse Marketplace</button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} currency={currency} onViewDetails={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <CredentialModal order={selectedOrder} currency={currency} onClose={() => setSelectedOrder(null)} />
      )}
      <Footer />
    </div>
  );
};

const StatCard = ({ icon, bg, label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`${bg} rounded-xl p-2.5 flex-shrink-0`}>{icon}</div>
    <div><p className="text-xs text-gray-500 font-medium">{label}</p><p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p></div>
  </div>
);

const OrderCard = ({ order, currency, onViewDetails }) => {
  const listing = order.listing;
  const [imgError, setImgError] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-36 h-28 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
          {listing?.images?.[0] && !imgError ? (
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">{platformIcons[listing?.platform]}</div>
          )}
        </div>
        <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">{platformIcons[listing?.platform]}<h3 className="font-semibold text-gray-800 truncate">{listing?.title}</h3></div>
            <p className="text-sm text-gray-500 mb-3">@{listing?.username} · <span className="capitalize">{listing?.platform}</span></p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span className="text-gray-400">Order: <span className="font-mono">{order.id.slice(0, 8)}…</span></span>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
            <div className="text-right">
              <p className="text-xl font-bold text-gray-800">{currency}{order.amount?.toLocaleString()}</p>
              {order.isPaid ? <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-600 px-2.5 py-1 rounded-full mt-1"><CheckCircle2 size={11} /> Paid</span>
                           : <span className="inline-flex text-xs font-medium bg-yellow-100 text-yellow-600 px-2.5 py-1 rounded-full mt-1">Pending</span>}
            </div>
            <button onClick={onViewDetails} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-all">
              <KeyRound size={13} /> View Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CredentialModal = ({ order, currency, onClose }) => {
  const listing = order.listing;
  const [credential, setCredential]     = useState(null);
  const [loadingCred, setLoadingCred]   = useState(true);
  const [credError, setCredError]       = useState(null);
  const [revealedFields, setRevealedFields] = useState({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    api.get(`/orders/${order.id}/credentials`)
      .then(r => setCredential(r.data))
      .catch(err => setCredError(err.message))
      .finally(() => setLoadingCred(false));
    return () => { document.body.style.overflow = ''; };
  }, [order.id]);

  const toggleReveal = (key) => setRevealedFields(prev => ({ ...prev, [key]: !prev[key] }));
  const creds = credential?.updatedCredential?.length ? credential.updatedCredential : credential?.originalCredential ?? [];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full max-w-lg h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 sm:rounded-t-2xl flex items-start justify-between flex-shrink-0">
          <div><h3 className="font-semibold text-lg">Order Details</h3><p className="text-indigo-200 text-sm mt-0.5">{listing?.title}</p></div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition ml-4"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {listing?.images?.[0] && <img src={listing.images[0]} alt="" className="size-12 rounded-lg object-cover border border-gray-200" />}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-800 truncate">{listing?.title}</p>
              <p className="text-sm text-gray-500 capitalize">@{listing?.username} · {listing?.platform}</p>
            </div>
            <p className="text-indigo-600 font-bold flex-shrink-0">{currency}{order.amount?.toLocaleString()}</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <ShieldCheck size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">These credentials are only visible to you. Change the account email and password immediately after purchase.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3"><KeyRound size={16} className="text-indigo-500" /><h4 className="font-semibold text-gray-800">Account Credentials</h4></div>
            {loadingCred ? (
              <div className="flex justify-center py-8"><Loader2 size={22} className="text-indigo-400 animate-spin" /></div>
            ) : credError ? (
              <div className="text-center py-8 text-gray-400"><Lock size={24} className="mx-auto mb-2" /><p className="text-sm">{credError}</p></div>
            ) : creds.length === 0 ? (
              <div className="text-center py-8 text-gray-400"><Lock size={24} className="mx-auto mb-2" /><p className="text-sm">Credentials not yet available.</p></div>
            ) : (
              <div className="space-y-3">
                {creds.map((cred, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                    <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">{cred.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        {cred.type === 'password' && !revealedFields[i] ? '•'.repeat(cred.value?.length || 8) : cred.value}
                      </div>
                      {cred.type === 'password' && (
                        <button onClick={() => toggleReveal(i)} className="p-2 text-gray-400 hover:text-indigo-600 border border-gray-200 rounded-lg hover:border-indigo-200 transition">
                          {revealedFields[i] ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex justify-between">
            <span>Order: <span className="font-mono">{order.id.slice(0, 16)}…</span></span>
            <span>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
