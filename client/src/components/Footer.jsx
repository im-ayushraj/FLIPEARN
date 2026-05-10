import React from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <footer className="px-6 md:px-16 lg:px-24 xl:px-32 w-full text-sm text-slate-500 bg-white pt-10 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14">

        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <img src={assets.logo} alt="FlipEarn" className="h-10 mb-4 cursor-pointer" onClick={() => { window.scrollTo(0, 0) }} />
          <p className="text-sm/7 text-gray-500 max-w-xs">
            FlipEarn is the #1 marketplace to securely buy and sell social media accounts — Instagram, YouTube, TikTok, and more. Fast, safe, and hassle-free.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition text-gray-500" aria-label="Twitter">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.774-8.878L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition text-gray-500" aria-label="Instagram">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition text-gray-500" aria-label="LinkedIn">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col lg:items-center lg:justify-center">
          <div className="flex flex-col text-sm space-y-2.5">
            <h2 className="font-semibold mb-3 text-gray-800">Quick Links</h2>
            <Link to="/" onClick={() => scrollTo(0,0)} className="hover:text-indigo-600 transition">Home</Link>
            <Link to="/marketplace" onClick={() => scrollTo(0,0)} className="hover:text-indigo-600 transition">Marketplace</Link>
            <Link to="/my-listings" className="hover:text-indigo-600 transition">My Listings</Link>
            <Link to="/my-orders" className="hover:text-indigo-600 transition">My Orders</Link>
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Stay Updated</h2>
          <div className="text-sm space-y-4 max-w-sm">
            <p className="text-gray-500">Get the latest listings, platform news, and marketplace tips sent to your inbox weekly.</p>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50 border border-indigo-100">
              <input
                className="focus:ring-2 bg-white ring-indigo-600 outline-none w-full max-w-64 py-2 rounded-lg px-2 text-sm"
                type="email"
                placeholder="Enter your email"
              />
              <button className="bg-indigo-600 px-4 py-2 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex-shrink-0">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-5 mt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} FlipEarn. All rights reserved.</p>
        <div className="flex gap-4 text-xs text-gray-400">
          <a href="#" className="hover:text-indigo-500 transition">Privacy Policy</a>
          <a href="#" className="hover:text-indigo-500 transition">Terms of Service</a>
          <a href="#" className="hover:text-indigo-500 transition">Contact</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
