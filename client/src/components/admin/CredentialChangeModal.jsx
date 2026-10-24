import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowUpRightFromSquareIcon, CopyIcon, Loader2Icon, XIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { socialMediaLinks } from '../../assets/assets';
import api from '../../lib/api';

const CredentialChangeModal = ({ listing, onChanged, onClose }) => {
    const [isChanged, setIsChanged] = useState(false);
    const [updating, setUpdating] = useState(false);
    const credentials = listing.credentials || [];

    const copyToClipboard = ({ label, value }) => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copied to clipboard`);
    };

    const markAsChanged = async () => {
        if (!isChanged) {
            toast.error('Please confirm credentials have been changed');
            return;
        }

        try {
            setUpdating(true);
            await api.patch(`/admin/credentials/${listing.id}/mark-changed`);
            toast.success('Credentials marked as changed');
            onChanged?.();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-100 flex items-center justify-center sm:p-4'>
            <div className='bg-white sm:rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col'>
                {/* Header */}
                <div className='bg-gradient-to-r from-indigo-600 to-indigo-400 text-white p-4 sm:rounded-t-lg flex items-center justify-between sticky top-0'>
                    <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-lg truncate'>{listing?.title}</h3>
                        <p className='text-sm text-indigo-100 truncate'>
                            changing credentials for <span className='font-medium text-white'>{listing?.username}</span> on {listing?.platform}
                        </p>
                    </div>
                    <button onClick={onClose} className='ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0'>
                        <XIcon className='w-5 h-5' />
                    </button>
                </div>

                {/* Content */}
                <div className='flex-1 overflow-y-auto p-4'>
                    {credentials.length === 0 ? (
                        <div className='text-center text-gray-500 py-8'>
                            <p>No credentials found for this listing</p>
                        </div>
                    ) : (
                        <div className='flex flex-col gap-4 text-gray-700'>
                            <div>
                                <h4 className='font-semibold text-sm text-gray-800 mb-3'>Current Credentials</h4>
                                {credentials.map((cred, index) => (
                                    <div key={index} className='w-full flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition mb-2'>
                                        <div className='flex items-center gap-2 min-w-0'>
                                            <span className='font-medium text-sm'>{cred.label}:</span>
                                            <span className='text-gray-600 truncate'>
                                                {cred.label.toLowerCase() === 'password' ? '••••••••' : cred.value}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(cred)}
                                            className='p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded transition flex-shrink-0'
                                            title='Copy to clipboard'
                                        >
                                            <CopyIcon size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className='text-sm flex gap-1 items-center p-3 bg-blue-50 rounded-lg border border-blue-100'>
                                <p>Open Platform : </p>
                                <Link 
                                    to={socialMediaLinks[listing.platform] || '#'} 
                                    target='_blank' 
                                    className='flex gap-1 items-center text-indigo-600 hover:text-indigo-800 font-medium'
                                >
                                    click here
                                    <ArrowUpRightFromSquareIcon size={13} />
                                </Link>
                            </div>

                            <div className='flex gap-3 items-start p-3 bg-yellow-50 rounded-lg border border-yellow-100'>
                                <input 
                                    type='checkbox' 
                                    checked={isChanged}
                                    onChange={() => setIsChanged(!isChanged)} 
                                    className='size-4 mt-1 text-indigo-500 bg-gray-100 cursor-pointer' 
                                />
                                <p className='text-gray-700 text-sm'>
                                    I confirm that the account owner has changed the credentials on the platform. The credentials above are no longer valid.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className='border-t border-gray-200 p-4 flex gap-2 sticky bottom-0 bg-white'>
                    <button 
                        onClick={onClose}
                        className='flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm'
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={markAsChanged}
                        disabled={!isChanged || updating}
                        className='flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm flex items-center justify-center gap-2'
                    >
                        {updating ? (
                            <>
                                <Loader2Icon size={16} className='animate-spin' />
                                Updating...
                            </>
                        ) : (
                            'Mark as Changed'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CredentialChangeModal;
