import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Public pages
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import MyListings from "./pages/MyListings";
import ListingDetails from "./pages/ListingDetails";
import DemoPayment from "./pages/DemoPayment";
import ManageListing from "./pages/ManageListing";
import MyOrders from "./pages/MyOrders";
import Loading from "./pages/Loading";
import Navbar from "./components/Navbar";

// Admin pages
import AdminLayout from "./pages/admin/Layout";
import Dashboard from "./pages/admin/Dashboard";
import AllListings from "./pages/admin/AllListings";
import CredentialVerify from "./pages/admin/CredentialVerify";
import CredentialChange from "./pages/admin/CredentialChange";
import Transactions from "./pages/admin/Transactions";
import Withdrawal from "./pages/admin/Withdrawal";

const App = () => {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div>
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "14px", borderRadius: "12px" } }}
      />
      {!isAdmin && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/my-listings" element={<MyListings />} />
        <Route path="/listing/:listingId" element={<ListingDetails />} />
        <Route path="/checkout/:listingId" element={<DemoPayment />} />
        <Route path="/create-listing" element={<ManageListing />} />
        <Route path="/edit-listing/:listingId" element={<ManageListing />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/loading" element={<Loading />} />

        {/* Admin — nested under AdminLayout (has its own Clerk auth gate) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="verify-credentials" element={<CredentialVerify />} />
          <Route path="change-credentials" element={<CredentialChange />} />
          <Route path="list-listings" element={<AllListings />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="withdrawal" element={<Withdrawal />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
