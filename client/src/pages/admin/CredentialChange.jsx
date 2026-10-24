import AdminTitle from '../../components/admin/AdminTitle';
import { useEffect, useState } from 'react';
import { Loader2Icon, AlertCircle } from 'lucide-react';
import CredentialChangeModal from '../../components/admin/CredentialChangeModal';
import { useAdminRefresh } from './Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const CredentialChange = () => {
    const { tick } = useAdminRefresh();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(null);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/credentials/pending-change');
            setListings(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchListings(); }, [tick]);

    const handleChanged = async (listingId) => {
        try {
            await api.patch(`/admin/credentials/${listingId}/mark-changed`);
            setListings(prev => prev.filter(l => l.id !== listingId));
            toast.success('Credentials marked as changed');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return (
        <div className='flex items-center justify-center h-full'>
            <Loader2Icon className='animate-spin text-indigo-600 size-7' />
        </div>
    );

    if (error) return (
        <div className='flex items-center gap-3 text-red-500 p-4 bg-red-50 rounded-xl mb-4'>
            <AlertCircle size={18} />
            {error}
        </div>
    );

    return (
        <div className='h-full'>
            {listings.length === 0 ? (
                <div className='flex flex-col items-center justify-center text-center text-gray-600 h-64'>
                    <h3 className='text-2xl font-bold'>All Credentials Changed ✓</h3>
                    <p className='text-gray-400 mt-1'>No listings with unchanged credentials.</p>
                </div>
            ) : (
                <>
                    <AdminTitle text1='Change' text2='Credentials' />
                    <div className='mt-6 overflow-x-auto bg-white border border-gray-200 w-full max-w-5xl rounded-xl'>
                        <table className='w-full text-sm text-left text-gray-700'>
                            <thead className='text-xs uppercase border-b border-gray-200 bg-gray-50'>
                                <tr>
                                    <th className='pl-4 py-3'>#</th>
                                    <th className='px-4 py-3'>Title</th>
                                    <th className='px-4 py-3'>Niche</th>
                                    <th className='px-4 py-3'>Platform</th>
                                    <th className='px-4 py-3'>Username</th>
                                    <th className='px-4 py-3'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map((listing, index) => (
                                    <tr key={listing.id} className='border-t border-gray-200 hover:bg-indigo-50/50'>
                                        <td className='pl-4 py-3'>{index + 1}.</td>
                                        <td className='px-4 py-3 font-medium'>{listing.title}</td>
                                        <td className='px-4 py-3 capitalize'>{listing.niche}</td>
                                        <td className='px-4 py-3 capitalize'>{listing.platform}</td>
                                        <td className='px-4 py-3'>@{listing.username}</td>
                                        <td className='px-4 py-3'>
                                            <button 
                                                onClick={() => setShowModal(listing)} 
                                                className='text-indigo-600 font-medium text-xs hover:underline'
                                            >
                                                Change
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {showModal && (
                        <CredentialChangeModal 
                            listing={showModal} 
                            onChanged={() => handleChanged(showModal.id)}
                            onClose={() => setShowModal(null)} 
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default CredentialChange;
