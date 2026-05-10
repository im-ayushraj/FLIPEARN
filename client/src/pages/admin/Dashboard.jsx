import { ChartLineIcon, CircleDollarSignIcon, ListIcon, Loader2Icon, UsersIcon, AlertCircle } from 'lucide-react';
import AdminTitle from '../../components/admin/AdminTitle';
import { useState, useEffect } from 'react';
import ListingDetailsModal from '../../components/admin/ListingDetailsModal';
import { useAdminRefresh } from './Layout';
import api from '../../lib/api';

const Dashboard = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$';
    const { tick } = useAdminRefresh();

    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [data, setData]       = useState({ totalListings: 0, totalRevenue: 0, activeListings: 0, totalUser: 0, recentListings: [] });
    const [showModal, setShowModal] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/admin/dashboard');
                setData(res.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [tick]);

    const cards = [
        { title: 'Total Listings',  value: data.totalListings,                          icon: ChartLineIcon,        color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { title: 'Total Revenue',   value: currency + (data.totalRevenue ?? 0).toLocaleString(), icon: CircleDollarSignIcon, color: 'text-green-500',  bg: 'bg-green-50'  },
        { title: 'Active Listings', value: data.activeListings,                          icon: ListIcon,             color: 'text-purple-500', bg: 'bg-purple-50' },
        { title: 'Total Users',     value: data.totalUser,                               icon: UsersIcon,            color: 'text-orange-500', bg: 'bg-orange-50' },
    ];

    if (loading) return <div className='flex items-center justify-center h-full'><Loader2Icon className='animate-spin text-indigo-600 size-7' /></div>;
    if (error)   return <div className='flex items-center gap-3 text-red-500 p-4 bg-red-50 rounded-xl'><AlertCircle size={18} />{error}</div>;

    return (
        <>
            <AdminTitle text1='Admin' text2='Dashboard' />
            <div className='flex flex-wrap gap-4 mt-6'>
                {cards.map((card, i) => (
                    <div key={i} className='flex items-center gap-4 px-5 py-4 bg-white border border-gray-200 rounded-xl min-w-44 flex-1'>
                        <div className={`${card.bg} rounded-xl p-2.5`}><card.icon size={20} className={card.color} /></div>
                        <div><p className='text-xs text-gray-500 font-medium'>{card.title}</p><p className='text-xl font-bold text-gray-800 mt-0.5'>{card.value}</p></div>
                    </div>
                ))}
            </div>
            <p className='mt-10 text-lg font-semibold text-gray-700'>Recent Listings</p>
            <div className='mt-4 overflow-x-auto bg-white border border-gray-200 w-full max-w-5xl rounded-xl'>
                <table className='w-full text-sm text-left text-gray-700'>
                    <thead className='text-xs uppercase border-b border-gray-200 bg-gray-50'>
                        <tr><th className='pl-4 py-3'>#</th><th className='px-4 py-3'>Title</th><th className='px-4 py-3'>Niche</th><th className='px-4 py-3'>Platform</th><th className='px-4 py-3'>Username</th></tr>
                    </thead>
                    <tbody>
                        {data.recentListings.map((l, i) => (
                            <tr onClick={() => setShowModal(l)} key={l.id} className='border-t border-gray-200 hover:bg-indigo-50/50 cursor-pointer'>
                                <td className='pl-4 py-3'>{i + 1}.</td>
                                <td className='px-4 py-3 font-medium'>{l.title}</td>
                                <td className='px-4 py-3 capitalize'>{l.niche}</td>
                                <td className='px-4 py-3 capitalize'>{l.platform}</td>
                                <td className='px-4 py-3'>@{l.username}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && <ListingDetailsModal listing={showModal} onClose={() => setShowModal(null)} />}
        </>
    );
};

export default Dashboard;
