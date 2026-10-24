import { NavLink } from 'react-router-dom';
import { BanknoteIcon, CheckIcon, LayoutDashboardIcon, ListIcon, Settings2Icon, WalletIcon, ClipboardCheckIcon } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const AdminSidebar = () => {
  const { user } = useUser();

  const adminNavlinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboardIcon },
    { name: 'Verify Listings', path: '/admin/verify-listings', icon: ClipboardCheckIcon },
    { name: 'Verify Credentials', path: '/admin/verify-credentials', icon: CheckIcon },
    { name: 'Change Credentials', path: '/admin/change-credentials', icon: Settings2Icon },
    { name: 'All Listings', path: '/admin/list-listings', icon: ListIcon },
    { name: 'Transactions', path: '/admin/transactions', icon: BanknoteIcon },
    { name: 'Withdrawal', path: '/admin/withdrawal', icon: WalletIcon },
  ];

  return (
    <div className='h-[calc(100vh-64px)] flex flex-col items-center pt-8 max-w-16 md:max-w-56 w-full border-r border-gray-200 text-sm bg-white'>
      {/* Admin user */}
      <img
        className='size-10 md:size-12 rounded-full mx-auto object-cover border-2 border-indigo-100'
        src={user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Admin')}&background=e0e7ff&color=4f46e5`}
        alt="admin"
      />
      <p className='mt-2 text-sm font-medium text-gray-800 max-md:hidden text-center px-2 truncate w-full'>
        {user?.firstName} {user?.lastName}
      </p>
      <p className='text-xs text-indigo-500 max-md:hidden mb-4'>Admin</p>

      <div className='w-full mt-2'>
        {adminNavlinks.map((link, index) => (
          <NavLink
            key={index}
            to={link.path}
            end
            className={({ isActive }) =>
              `relative flex items-center max-md:justify-center gap-3 w-full py-2.5 md:pl-6 text-gray-600 transition ${
                isActive ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className="w-4 h-4 flex-shrink-0" />
                <p className="max-md:hidden text-sm">{link.name}</p>
                {isActive && <span className="w-1 h-8 rounded-l bg-indigo-500 right-0 absolute" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;
