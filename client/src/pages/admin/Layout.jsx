import { Outlet, Link, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminNavbar from "../../components/admin/AdminNavbar";
import { useUser, useClerk, SignIn } from "@clerk/clerk-react";
import { ArrowRightIcon, Loader2Icon, ShieldAlert, RefreshCw } from "lucide-react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

/* ─── Realtime Context ──────────────────────────────────────
   Provides a global "refresh" trigger + "last updated" time
   to all admin sub-pages. Sub-pages subscribe via useAdminRefresh().
─────────────────────────────────────────────────────────── */
export const AdminRefreshContext = createContext({ tick: 0, lastUpdated: null, refresh: () => {} });
export const useAdminRefresh = () => useContext(AdminRefreshContext);

const REFRESH_INTERVAL_MS = 30_000; // auto-refresh every 30s

const Layout = () => {
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Realtime tick — incremented on every refresh
  const [tick, setTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 400)); // brief visual pulse
    setTick(t => t + 1);
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    setLastUpdated(new Date()); // initial load time
    return () => clearInterval(id);
  }, [refresh]);

  // ── Loading state (Clerk hasn't resolved yet)
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2Icon className="size-7 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // ── Not logged in → show Clerk SignIn
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-6">
        <div className="flex flex-col items-center mb-2">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
            <ShieldAlert size={28} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Access Required</h1>
          <p className="text-gray-500 text-sm mt-1 text-center max-w-sm">
            Sign in with your admin account to access the FlipEarn admin panel.
          </p>
        </div>
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full max-w-sm",
              card: "rounded-2xl shadow-sm border border-gray-100",
            },
            variables: { colorPrimary: "#4f46e5" },
          }}
          afterSignInUrl="/admin"
        />
        <Link to="/" className="text-sm text-indigo-500 hover:underline">← Back to FlipEarn</Link>
      </div>
    );
  }

  // ── Logged in but NOT admin (check publicMetadata.role)
  const isAdmin = user?.publicMetadata?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center gap-4 p-6">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
          <ShieldAlert size={28} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Your account <span className="font-medium text-gray-700">{user.primaryEmailAddress?.emailAddress}</span> does not have admin privileges.
          Contact the site owner to get access.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition"
        >
          Go to Home <ArrowRightIcon size={15} />
        </Link>
      </div>
    );
  }

  // ── Admin is authenticated ✓
  return (
    <AdminRefreshContext.Provider value={{ tick, lastUpdated, refresh, isRefreshing }}>
      <AdminNavbar
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
      />
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] bg-slate-50 overflow-y-auto">
          {/* Refresh status bar */}
          <div className="flex items-center gap-2 mb-6 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
            <span>
              {isRefreshing ? 'Refreshing data...' : `Last updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}`}
            </span>
            <span className="mx-1">·</span>
            <span>Auto-refreshes every 30s</span>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="ml-2 flex items-center gap-1 text-indigo-500 hover:text-indigo-700 font-medium disabled:opacity-50 transition"
            >
              <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh now
            </button>
          </div>
          <Outlet />
        </div>
      </div>
    </AdminRefreshContext.Provider>
  );
};

export default Layout;
