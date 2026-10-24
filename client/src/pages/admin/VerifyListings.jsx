import AdminTitle from '../../components/admin/AdminTitle';
import { useEffect, useState } from 'react';
import { Loader2Icon, CheckIcon, XIcon, AlertCircle, Eye, Mail } from 'lucide-react';
import ListingDetailsModal from '../../components/admin/ListingDetailsModal';
import { useAdminRefresh } from './Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const VerifyListings = () => {
    const { tick } = useAdminRefresh();
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState([]);
    const [detailsModal, setDetailsModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [error, setError] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchPendingListings();
    }, [tick]);

    const fetchPendingListings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/listings/pending');
            setListings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (listingId) => {
        try {
            await api.patch(`/admin/listings/${listingId}/verify`);
            setListings(prev => prev.filter(l => l.id !== listingId));
            toast.success('Listing verified and now live on marketplace');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            await api.patch(`/admin/listings/${rejectModal.id}/reject`, {
                reason: rejectionReason
            });
            setListings(prev => prev.filter(l => l.id !== rejectModal.id));
            toast.success('Listing rejected');
            setRejectModal(null);
            setRejectionReason('');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className='flex items-center justify-center h-full'><Loader2Icon className='animate-spin text-indigo-600 size-7' /></div>;

    return (
        <div>
            <AdminTitle text1='Verify' text2='Listings' />
            
            {error && (
                <div className='flex items-center gap-3 text-red-500 p-4 bg-red-50 rounded-xl mb-4'>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {listings.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200'>
                    <CheckIcon size={32} className='text-green-500 mb-3' />
                    <h3 className='font-semibold text-gray-800'>All caught up!</h3>
                    <p className='text-sm text-gray-500 mt-1'>No pending listings to verify</p>
                </div>
            ) : (
                <div className='space-y-4'>
                    {listings.map((listing) => (
                        <div
                            key={listing.id}
                            className='bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition'
                        >
                            <div className='flex items-start justify-between gap-4'>
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-start gap-3 mb-2'>
                                        {listing.images?.[0] && (
                                            <img
                                                src={listing.images[0]}
                                                alt=''
                                                className='w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0'
                                            />
                                        )}
                                        <div className='flex-1 min-w-0'>
                                            <h3 className='font-semibold text-gray-800 text-lg'>{listing.title}</h3>
                                            <p className='text-sm text-gray-500'>@{listing.username} · {listing.platform}</p>
                                        </div>
                                    </div>
                                    
                                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm'>
                                        <div className='bg-gray-50 p-2 rounded-lg'>
                                            <p className='text-xs text-gray-500'>Followers</p>
                                            <p className='font-semibold text-gray-800'>{listing.followers_count?.toLocaleString()}</p>
                                        </div>
                                        <div className='bg-gray-50 p-2 rounded-lg'>
                                            <p className='text-xs text-gray-500'>Price</p>
                                            <p className='font-semibold text-gray-800'>${listing.price?.toLocaleString()}</p>
                                        </div>
                                        <div className='bg-gray-50 p-2 rounded-lg'>
                                            <p className='text-xs text-gray-500'>Niche</p>
                                            <p className='font-semibold text-gray-800 capitalize'>{listing.niche}</p>
                                        </div>
                                        <div className='bg-gray-50 p-2 rounded-lg'>
                                            <p className='text-xs text-gray-500'>Seller</p>
                                            <p className='font-semibold text-gray-800 truncate'>{listing.owner?.name}</p>
                                        </div>
                                    </div>

                                    {listing.hasCredentials && (
                                        <div className='mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit'>
                                            <Mail size={12} />
                                            Credentials submitted
                                        </div>
                                    )}
                                </div>

                                <div className='flex gap-2 flex-shrink-0'>
                                    <button
                                        onClick={() => setDetailsModal(listing)}
                                        className='p-2.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition'
                                        title='View details'
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleVerify(listing.id)}
                                        className='px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2'
                                    >
                                        <CheckIcon size={16} /> Approve
                                    </button>
                                    <button
                                        onClick={() => setRejectModal(listing)}
                                        className='px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2'
                                    >
                                        <XIcon size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {detailsModal && (
                <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                        <div className='sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between'>
                            <h2 className='text-lg font-semibold text-gray-800'>Listing Details</h2>
                            <button
                                onClick={() => setDetailsModal(null)}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <XIcon size={24} />
                            </button>
                        </div>

                        <div className='p-6 space-y-4'>
                            <ListingDetailsModal listing={detailsModal} onClose={() => setDetailsModal(null)} />
                        </div>
                    </div>
                </div>
            )}

            {rejectModal && (
                <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl max-w-md w-full'>
                        <div className='border-b border-gray-200 p-5 flex items-center justify-between'>
                            <h2 className='text-lg font-semibold text-gray-800'>Reject Listing</h2>
                            <button
                                onClick={() => {
                                    setRejectModal(null);
                                    setRejectionReason('');
                                }}
                                className='text-gray-400 hover:text-gray-600'
                            >
                                <XIcon size={24} />
                            </button>
                        </div>

                        <div className='p-6 space-y-4'>
                            <div>
                                <p className='text-sm text-gray-600 mb-3'>
                                    <strong>{rejectModal.title}</strong> by <strong>@{rejectModal.username}</strong>
                                </p>
                            </div>

                            <div>
                                <label className='block text-sm font-medium text-gray-800 mb-2'>Rejection Reason</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder='Explain why this listing is being rejected...'
                                    className='w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none'
                                    rows={4}
                                    autoFocus
                                />
                            </div>

                            <div className='flex gap-2 pt-2'>
                                <button
                                    onClick={handleReject}
                                    className='flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium'
                                >
                                    Reject Listing
                                </button>
                                <button
                                    onClick={() => {
                                        setRejectModal(null);
                                        setRejectionReason('');
                                    }}
                                    className='flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition font-medium'
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerifyListings;
