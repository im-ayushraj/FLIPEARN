import AdminTitle from '../../components/admin/AdminTitle';
import { useEffect, useState } from 'react';
import { CheckCircleIcon, Loader2Icon, MailCheckIcon, XIcon, AlertCircle } from 'lucide-react';
import ListingDetailsModal from '../../components/admin/ListingDetailsModal';
import { useAdminRefresh } from './Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const AllListings = () => {
    const { tick } = useAdminRefresh();
    const [loading, setLoading]   = useState(true);
    const [listings, setListings] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [error, setError] = useState(null);

    const colorMap = {
        notSubmit: { bg: 'bg-red-100',    text: 'text-red-600',    icon: XIcon           },
        submitted: { bg: 'bg-yellow-100', text: 'text-yellow-600', icon: MailCheckIcon   },
        verified:  { bg: 'bg-blue-100',   text: 'text-blue-600',   icon: CheckCircleIcon },
        changed:   { bg: 'bg-green-100',  text: 'text-green-600',  icon: CheckCircleIcon },
    };

    useEffect(() => {
        api.get('/admin/listings')
            .then(r => setListings(r.data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [tick]);

    const changeStatus = async (status, listing) => {
        try {
            await api.patch(`/admin/listings/${listing.id}/status`, { status });
            setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status } : l));
            toast.success('Status updated');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className='flex items-center justify-center h-full'><Loader2Icon className='animate-spin text-indigo-600 size-7' /></div>;
    if (error)   return <div className='flex items-center gap-3 text-red-500 p-4 bg-red-50 rounded-xl'><AlertCircle size={18}/>{error}</div>;

    return (
        <div>
            <AdminTitle text1='All' text2='Listings' />
            <div className='mt-6 overflow-x-auto bg-white border border-gray-200 w-full max-w-5xl rounded-xl'>
                <table className='w-full text-sm text-left text-gray-700'>
                    <thead className='text-xs uppercase border-b border-gray-200 bg-gray-50'>
                        <tr><th className='pl-4 py-3'>#</th><th className='px-4 py-3'>Title</th><th className='px-4 py-3'>Niche</th><th className='px-4 py-3'>Platform</th><th className='px-4 py-3'>Username</th><th className='px-4 py-3'>Credentials</th><th className='px-4 py-3'>Status</th></tr>
                    </thead>
                    <tbody>
                        {listings.map((l, i) => {
                            const credKey = l.isCredentialChanged ? 'changed' : l.isCredentialVerified ? 'verified' : l.isCredentialSubmitted ? 'submitted' : 'notSubmit';
                            const color   = colorMap[credKey];
                            return (
                                <tr onClick={() => setShowModal(l)} key={l.id} className='border-t border-gray-200 hover:bg-indigo-50/50 cursor-pointer'>
                                    <td className='pl-4 py-3'>{i + 1}.</td>
                                    <td className='px-4 py-3 font-medium'>{l.title}</td>
                                    <td className='px-4 py-3 capitalize'>{l.niche}</td>
                                    <td className='px-4 py-3 capitalize'>{l.platform}</td>
                                    <td className='px-4 py-3'>@{l.username}</td>
                                    <td className='px-4 py-3'>
                                        <span className={`flex items-center gap-1 px-2 text-xs py-0.5 rounded-full w-fit ${color.bg} ${color.text}`}>
                                            <color.icon size={12} />
                                            <span className='font-medium'>{l.isCredentialChanged ? 'Changed' : l.isCredentialVerified ? 'Verified' : l.isCredentialSubmitted ? 'Submitted' : 'Not Submit'}</span>
                                        </span>
                                    </td>
                                    <td className='px-4 py-3' onClick={e => e.stopPropagation()}>
                                        <select value={l.status} onChange={e => changeStatus(e.target.value, l)}
                                            className='px-2 py-1.5 text-gray-500 border border-gray-300 rounded-md outline-none text-xs'>
                                            <option value='active'>Active</option>
                                            <option value='inactive'>Inactive</option>
                                            <option value='ban'>Ban</option>
                                            <option value='sold'>Sold</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {showModal && <ListingDetailsModal listing={showModal} onClose={() => setShowModal(null)} />}
        </div>
    );
};

export default AllListings;
