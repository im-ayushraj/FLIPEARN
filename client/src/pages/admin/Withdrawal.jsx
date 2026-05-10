import AdminTitle from '../../components/admin/AdminTitle';
import { useState, useEffect } from 'react';
import { Loader2Icon, AlertCircle } from 'lucide-react';
import { useAdminRefresh } from './Layout';
import WithdrawalDetail from '../../components/admin/WithdrawalDetail';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const Withdrawal = () => {
    const currency = import.meta.env.VITE_CURRENCY || '$';
    const { tick } = useAdminRefresh();
    const [requests, setRequests]       = useState([]);
    const [isLoading, setIsLoading]     = useState(true);
    const [error, setError]             = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/admin/withdrawals');
            setRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [tick]);

    const handlePay = async (id) => {
        try {
            await api.patch(`/admin/withdrawals/${id}/pay`);
            toast.success('Withdrawal marked as paid');
            setSelectedRequest(null);
            fetchData();
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (isLoading) return <div className='flex items-center justify-center h-full'><Loader2Icon className='size-7 text-indigo-500 animate-spin' /></div>;
    if (error)     return <div className='flex items-center gap-3 text-red-500 p-4 bg-red-50 rounded-xl'><AlertCircle size={18}/>{error}</div>;

    return (
        <div>
            <AdminTitle text1='All' text2='Withdrawals' />
            <div className='mt-6 overflow-x-auto bg-white border border-gray-200 w-full max-w-6xl rounded-xl'>
                <table className='w-full text-sm text-left text-gray-700'>
                    <thead className='text-xs uppercase border-b border-gray-200 bg-gray-50'>
                        <tr><th className='pl-4 py-3'>#</th><th className='px-4 py-3'>User</th><th className='px-4 py-3'>Email</th><th className='px-4 py-3'>Amount</th><th className='px-4 py-3'>Requested</th><th className='px-4 py-3'>Status</th><th className='px-4 py-3 text-center'>Action</th></tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan='7' className='text-center py-8 text-gray-400'>No withdrawal requests found.</td></tr>
                        ) : requests.map((req, i) => (
                            <tr key={req.id} className='border-t border-gray-200 hover:bg-indigo-50/50'>
                                <td className='pl-4 py-3'>{i + 1}.</td>
                                <td className='px-4 py-3'>
                                    <div className='flex items-center gap-2'>
                                        <img src={req.user?.image} alt={req.user?.name} className='w-7 h-7 rounded-full object-cover' />
                                        <span className='font-medium'>{req.user?.name}</span>
                                    </div>
                                </td>
                                <td className='px-4 py-3 text-gray-500'>{req.user?.email}</td>
                                <td className='px-4 py-3 font-semibold text-gray-800'>{currency}{req.amount.toLocaleString()}</td>
                                <td className='px-4 py-3 text-gray-500'>{new Date(req.createdAt).toLocaleDateString()}</td>
                                <td className='px-4 py-3'>
                                    {req.isWithdrawn
                                        ? <span className='text-xs font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full'>Paid</span>
                                        : <span className='text-xs font-medium bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full'>Pending</span>}
                                </td>
                                <td className='px-4 py-3 text-center'>
                                    <button onClick={() => setSelectedRequest(req)} className='text-indigo-600 font-medium hover:underline text-xs'>Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedRequest && (
                <WithdrawalDetail
                    data={selectedRequest}
                    onPay={() => handlePay(selectedRequest.id)}
                    onClose={() => setSelectedRequest(null)}
                />
            )}
        </div>
    );
};

export default Withdrawal;
