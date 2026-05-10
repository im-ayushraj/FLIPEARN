import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { UserButton } from "@clerk/clerk-react";
import { RefreshCw } from "lucide-react";

const AdminNavbar = ({ lastUpdated, isRefreshing, onRefresh }) => {
  return (
    <div className="flex items-center justify-between px-6 md:px-10 h-16 border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/">
          <img className="h-8 w-auto" src={assets.logo} alt="logo" />
        </Link>
        <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Realtime indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <div className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span>{isRefreshing ? 'Refreshing...' : lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}</span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh data"
            className="ml-1 text-indigo-500 hover:text-indigo-700 disabled:opacity-40 transition"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        <Link to="/" className="text-xs text-gray-500 hover:text-indigo-600 transition hidden sm:block">
          ← View Site
        </Link>
        <UserButton afterSignOutUrl="/admin" />
      </div>
    </div>
  );
};

export default AdminNavbar;
