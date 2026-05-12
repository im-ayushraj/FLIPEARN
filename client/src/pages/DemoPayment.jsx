import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { ArrowLeft, ShoppingCart, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import Footer from '../components/Footer';
import api from '../lib/api';

const DemoPayment = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currency = import.meta.env.VITE_CURRENCY || '$';

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/listings/${listingId}`);
        setListing(data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  const handleCompletePayment = async () => {
    if (!user) {
      openSignIn();
      return;
    }

    if (!listing) return;

    try {
      setProcessing(true);
      setError('');

      const { data: transaction } = await api.post('/orders/initiate', { listingId: listing.id });
      await api.post(`/orders/${transaction.id}/confirm`);

      setSuccess(true);
      setMessage('Your purchase is complete. Credentials were requested by email and will appear in My Orders once available.');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to complete payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 md:px-16 lg:px-24 xl:px-32 py-4">
        <button
          onClick={() => navigate('/marketplace')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft size={16} /> Back to Marketplace
        </button>
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 font-semibold mb-2">Demo Checkout</p>
                <h1 className="text-3xl font-semibold text-gray-900">Purchase {listing?.title || 'Listing'}</h1>
                <p className="mt-2 text-sm text-gray-500 max-w-2xl">This is a demo payment experience. The checkout flow is built to mirror the Clerk-powered subscription/payment flow, but no real gateway is connected yet.</p>
              </div>
              <div className="rounded-3xl bg-indigo-600 px-5 py-4 text-white shadow-lg">
                <p className="text-sm uppercase tracking-[0.18em] text-indigo-100">Total</p>
                <p className="mt-2 text-3xl font-semibold">{currency}{listing?.price?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4">
              <div className="font-semibold">Purchase error</div>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-green-900 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 size={22} className="text-green-700" />
                <h2 className="text-xl font-semibold">Payment completed</h2>
              </div>
              <p className="text-sm text-green-800 mb-4">A confirmation message was sent to your email. If credentials are available, they will be delivered as soon as possible.</p>
              <button
                onClick={() => navigate('/my-orders')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-green-700 font-semibold border border-green-200 hover:bg-green-100 transition"
              >
                View My Orders
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Listing summary</h2>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-800">Title</span>
                      <span>{listing?.title || 'Loading...'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-800">Seller</span>
                      <span>{listing?.owner?.name || 'Unknown seller'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-800">Platform</span>
                      <span className="capitalize">{listing?.platform || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-800">Price</span>
                      <span>{currency}{listing?.price?.toLocaleString()}</span>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                      <p className="font-semibold text-gray-800">Note</p>
                      <p className="mt-1">After clicking continue, the order will be marked complete and an email will be sent with the account credentials submitted by the seller.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
                  <h2 className="font-semibold text-gray-800 mb-3">What happens next</h2>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-indigo-600"><ShieldCheck size={18} /></span>
                      <span>Secure demo checkout powered by the Clerk authentication experience.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-indigo-600"><ShoppingCart size={18} /></span>
                      <span>Your purchase will be recorded and the listing will be marked sold.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-indigo-600"><CheckCircle2 size={18} /></span>
                      <span>Credentials will be delivered by email and available under My Orders.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="font-semibold text-gray-800 mb-2">Secure checkout</h2>
                  <p className="text-sm text-gray-500">Sign in with Clerk to complete this purchase.</p>
                </div>
                {!user ? (
                  <button
                    onClick={() => openSignIn()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 transition"
                  >
                    Sign in to continue
                  </button>
                ) : (
                  <button
                    onClick={handleCompletePayment}
                    disabled={processing}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    <ShoppingCart size={16} /> {processing ? 'Processing…' : 'Complete payment'}
                  </button>
                )}
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-500 mt-1" />
                    <p>Please remember to change the account email/password immediately after purchase.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DemoPayment;
