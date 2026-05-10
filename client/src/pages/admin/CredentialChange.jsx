import AdminTitle from '../../components/admin/AdminTitle';
import { useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import CredentialChangeModal from '../../components/admin/CredentialChangeModal';
import { dummyListings } from '../../assets/assets';
import { useAdminRefresh } from './Layout';

const CredentialChange = () => {
    const { tick } = useAdminRefresh();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null);

    const fetchListings = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 300));
        setListings(dummyListings.filter(l => !l.isCredentialChanged));
        setLoading(false);
    };

    useEffect(() => { fetchListings(); }, [tick]);

    return loading ? (
        <div className='flex items-center justify-center h-full'>
            <Loader2Icon className='animate-spin text-indigo-600 size-7' />
        </div>
    ) : (
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
                                            <button onClick={() => setShowModal(listing)} className='text-indigo-600 font-medium text-xs hover:underline'>
                                                Change
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {showModal && (
                        <CredentialChangeModal listing={showModal} onClose={() => { fetchListings(); setShowModal(null); }} />
                    )}
                </>
            )}
        </div>
    );
};

export default CredentialChange;
