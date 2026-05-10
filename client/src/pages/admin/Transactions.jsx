import AdminTitle from '../../components/admin/AdminTitle';
import { useState, useEffect } from 'react';
import { Loader2Icon, AlertCircle } from 'lucide-react';
import { useAdminRefresh } from './Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const Transactions = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$';
    const { tick } = useAdminRefresh();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        api.get('/admin/transactions')
            .then(r => setTransactions(r.data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [tick]);

    if (loading) return <div className='flex items-center justify-center h-full'><Loader2Icon className='animate-spin text-indigo-600 size-7' /></div>;
    if (error)   return <div className='flex items-center gap-3 text-red-500 p-4 bg-red-50 rounded-xl'><AlertCircle size={18}/>{error}</div>;

    return (
        <div>
            <AdminTitle text1='All' text2='Transactions' />
            <div className='mt-6 overflow-x-auto bg-white border border-gray-200 w-full max-w-5xl rounded-xl'>
                <table className='w-full text-sm text-left text-gray-700'>
                    <thead className='text-xs uppercase border-b border-gray-200 bg-gray-50'>
                        <tr><th className='pl-4 py-3'>#</th><th className='px-4 py-3'>Username</th><th className='px-4 py-3'>Platform</th><th className='px-4 py-3'>Amount</th><th className='px-4 py-3'>Date</th><th className='px-4 py-3'>Status</th></tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr><td colSpan='6' className='text-center py-8 text-gray-400'>No transactions yet.</td></tr>
                        ) : transactions.map((t, i) => (
                            <tr key={t.id} className='border-t border-gray-200 hover:bg-indigo-50/50'>
                                <td className='pl-4 py-3'>{i + 1}.</td>
                                <td className='px-4 py-3'>@{t.listing?.username}</td>
                                <td className='px-4 py-3 capitalize'>{t.listing?.platform}</td>
                                <td className='px-4 py-3 font-semibold text-gray-800'>{currency}{t.amount?.toLocaleString()}</td>
                                <td className='px-4 py-3 text-gray-500'>{new Date(t.createdAt).toLocaleDateString()}</td>
                                <td className='px-4 py-3'>
                                    {t.isPaid
                                        ? <span className='text-xs font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full'>Paid</span>
                                        : <span className='text-xs font-medium bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full'>Pending</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Transactions;
