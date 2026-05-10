import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import ListingCard from '../components/ListingCard';
import Footer from '../components/Footer';
import {
  SlidersHorizontal, X, ChevronDown, Search,
  LayoutGrid, List, ArrowUpDown, Loader2
} from 'lucide-react';

const PLATFORMS = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin', 'pinterest', 'snapchat', 'twitch', 'discord'];
const NICHES    = ['lifestyle', 'fitness', 'food', 'travel', 'tech', 'gaming', 'fashion', 'beauty', 'business', 'education', 'entertainment', 'music', 'art', 'sports', 'health', 'finance', 'other'];
const SORT_OPTIONS = [
  { label: 'Newest First',          value: 'newest' },
  { label: 'Price: Low → High',     value: 'price_asc' },
  { label: 'Price: High → Low',     value: 'price_desc' },
  { label: 'Followers: High → Low', value: 'followers_desc' },
];

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const currency = import.meta.env.VITE_CURRENCY || '$';

  // Data
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Filters (applied client-side for instant UX)
  const [searchInput, setSearchInput]         = useState(searchParams.get('search') || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedNiches, setSelectedNiches]   = useState([]);
  const [priceRange, setPriceRange]           = useState([0, 20000]);
  const [onlyVerified, setOnlyVerified]       = useState(false);
  const [onlyMonetized, setOnlyMonetized]     = useState(false);
  const [sortBy, setSortBy]                   = useState('newest');
  const [showFilters, setShowFilters]         = useState(false);
  const [viewMode, setViewMode]               = useState('grid');

  // Fetch all active listings from backend
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get('/listings');
        setListings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const togglePlatform = (p) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleNiche    = (n) => setSelectedNiches(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);

  const clearFilters = () => {
    setSelectedPlatforms([]); setSelectedNiches([]);
    setPriceRange([0, 20000]); setOnlyVerified(false);
    setOnlyMonetized(false); setSortBy('newest'); setSearchInput('');
  };

  const activeFilterCount =
    selectedPlatforms.length + selectedNiches.length +
    (onlyVerified ? 1 : 0) + (onlyMonetized ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 20000 ? 1 : 0);

  const filtered = useMemo(() => {
    let result = listings;
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) || l.username?.toLowerCase().includes(q) ||
        l.platform?.toLowerCase().includes(q) || l.niche?.toLowerCase().includes(q)
      );
    }
    if (selectedPlatforms.length) result = result.filter(l => selectedPlatforms.includes(l.platform));
    if (selectedNiches.length)    result = result.filter(l => selectedNiches.includes(l.niche));
    if (onlyVerified)             result = result.filter(l => l.verified);
    if (onlyMonetized)            result = result.filter(l => l.monetized);
    result = result.filter(l => l.price >= priceRange[0] && l.price <= priceRange[1]);
    switch (sortBy) {
      case 'price_asc':      return [...result].sort((a, b) => a.price - b.price);
      case 'price_desc':     return [...result].sort((a, b) => b.price - a.price);
      case 'followers_desc': return [...result].sort((a, b) => b.followers_count - a.followers_count);
      default:               return result;
    }
  }, [listings, searchInput, selectedPlatforms, selectedNiches, onlyVerified, onlyMonetized, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-16 lg:px-24 xl:px-32 py-10">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-2">
          Explore the{' '}
          <span className="bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">Marketplace</span>
        </h1>
        <p className="text-gray-500 mb-6 max-w-xl">Browse verified social media accounts available for purchase.</p>
        <form onSubmit={e => e.preventDefault()} className="flex items-center max-w-2xl">
          <label className="border border-gray-300 rounded-xl p-1.5 flex items-center w-full bg-white shadow-sm">
            <Search size={16} className="ml-2 text-gray-400 flex-shrink-0" />
            <input
              type="text" value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by platform, niche, username..."
              className="pl-2 flex-1 outline-none text-sm text-gray-700 bg-transparent"
            />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput('')} className="mr-2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </label>
        </form>
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-8 flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <FilterPanel
            selectedPlatforms={selectedPlatforms} togglePlatform={togglePlatform}
            selectedNiches={selectedNiches} toggleNiche={toggleNiche}
            priceRange={priceRange} setPriceRange={setPriceRange}
            onlyVerified={onlyVerified} setOnlyVerified={setOnlyVerified}
            onlyMonetized={onlyMonetized} setOnlyMonetized={setOnlyMonetized}
            activeFilterCount={activeFilterCount} clearFilters={clearFilters}
          />
        </aside>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 bg-white hover:border-indigo-400 transition"
              >
                <SlidersHorizontal size={15} /> Filters
                {activeFilterCount > 0 && <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5">{activeFilterCount}</span>}
              </button>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : <><span className="font-semibold text-gray-800">{filtered.length}</span> listings found</>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 bg-white outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ArrowUpDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500'}`}><LayoutGrid size={15} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500'}`}><List size={15} /></button>
              </div>
            </div>
          </div>

          {/* Active chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedPlatforms.map(p => <Chip key={p} label={p} onRemove={() => togglePlatform(p)} />)}
              {selectedNiches.map(n => <Chip key={n} label={n} onRemove={() => toggleNiche(n)} />)}
              {onlyVerified  && <Chip label="Verified" onRemove={() => setOnlyVerified(false)} />}
              {onlyMonetized && <Chip label="Monetized" onRemove={() => setOnlyMonetized(false)} />}
              {(priceRange[0] > 0 || priceRange[1] < 20000) && (
                <Chip label={`${currency}${priceRange[0].toLocaleString()} – ${currency}${priceRange[1].toLocaleString()}`} onRemove={() => setPriceRange([0, 20000])} />
              )}
              <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline ml-1 font-medium">Clear all</button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 size={32} className="text-indigo-400 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Loading listings...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <X size={22} className="text-red-400" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">Failed to load listings</h3>
              <p className="text-sm text-gray-400 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition">
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-4'}>
              {filtered.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="relative ml-auto w-80 bg-white h-full shadow-xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-500"><X size={18} /></button>
            </div>
            <FilterPanel
              selectedPlatforms={selectedPlatforms} togglePlatform={togglePlatform}
              selectedNiches={selectedNiches} toggleNiche={toggleNiche}
              priceRange={priceRange} setPriceRange={setPriceRange}
              onlyVerified={onlyVerified} setOnlyVerified={setOnlyVerified}
              onlyMonetized={onlyMonetized} setOnlyMonetized={setOnlyMonetized}
              activeFilterCount={activeFilterCount} clearFilters={clearFilters}
            />
            <button onClick={() => setShowFilters(false)} className="mt-6 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
              Show {filtered.length} Results
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────── */
const Chip = ({ label, onRemove }) => (
  <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full capitalize">
    {label} <button onClick={onRemove}><X size={11} /></button>
  </span>
);

const FilterPanel = ({ selectedPlatforms, togglePlatform, selectedNiches, toggleNiche, priceRange, setPriceRange, onlyVerified, setOnlyVerified, onlyMonetized, setOnlyMonetized, activeFilterCount, clearFilters }) => {
  const [platformOpen, setPlatformOpen] = useState(true);
  const [nicheOpen, setNicheOpen]       = useState(true);
  const [priceOpen, setPriceOpen]       = useState(true);
  const currency = import.meta.env.VITE_CURRENCY || '$';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={15} /> Filters
          {activeFilterCount > 0 && <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5">{activeFilterCount}</span>}
        </h3>
        {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline font-medium">Clear all</button>}
      </div>
      <FilterSection title="Platform" open={platformOpen} toggle={() => setPlatformOpen(p => !p)}>
        <div className="grid grid-cols-2 gap-1.5 pt-2">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => togglePlatform(p)} className={`text-xs px-2 py-1.5 rounded-lg border capitalize transition ${selectedPlatforms.includes(p) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300 bg-white'}`}>{p}</button>
          ))}
        </div>
      </FilterSection>
      <FilterSection title="Niche" open={nicheOpen} toggle={() => setNicheOpen(p => !p)}>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {NICHES.map(n => (
            <button key={n} onClick={() => toggleNiche(n)} className={`text-xs px-2.5 py-1 rounded-full border capitalize transition ${selectedNiches.includes(n) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-gray-600 hover:border-indigo-300 bg-white'}`}>{n}</button>
          ))}
        </div>
      </FilterSection>
      <FilterSection title="Price Range" open={priceOpen} toggle={() => setPriceOpen(p => !p)}>
        <div className="pt-3 space-y-3">
          <div className="flex items-center gap-2">
            {[0, 1].map(i => (
              <div key={i} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 flex items-center gap-1">
                <span className="text-gray-400 text-xs">{currency}</span>
                <input type="number" value={priceRange[i]} min={i === 0 ? 0 : priceRange[0]} max={i === 0 ? priceRange[1] : 100000}
                  onChange={e => setPriceRange(i === 0 ? [Number(e.target.value), priceRange[1]] : [priceRange[0], Number(e.target.value)])}
                  className="w-full outline-none text-gray-700 text-sm bg-transparent"
                />
              </div>
            ))}
          </div>
          <input type="range" min={0} max={20000} step={500} value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400"><span>{currency}0</span><span>{currency}20,000+</span></div>
        </div>
      </FilterSection>
      <div className="border border-gray-200 rounded-xl p-3 bg-white space-y-3">
        <Toggle label="Verified Only"  checked={onlyVerified}  onChange={setOnlyVerified} />
        <Toggle label="Monetized Only" checked={onlyMonetized} onChange={setOnlyMonetized} />
      </div>
    </div>
  );
};

const FilterSection = ({ title, open, toggle, children }) => (
  <div className="border border-gray-200 rounded-xl p-3 bg-white">
    <button onClick={toggle} className="flex items-center justify-between w-full text-sm font-semibold text-gray-700">
      {title} <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && children}
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">{label}</span>
    <button onClick={() => onChange(!checked)} className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  </div>
);

const EmptyState = ({ onClear }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4"><Search size={24} className="text-indigo-400" /></div>
    <h3 className="text-lg font-semibold text-gray-800 mb-1">No listings found</h3>
    <p className="text-sm text-gray-500 mb-5 max-w-xs">Try adjusting your search or filters.</p>
    <button onClick={onClear} className="px-5 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition">Clear Filters</button>
  </div>
);

export default Marketplace;
