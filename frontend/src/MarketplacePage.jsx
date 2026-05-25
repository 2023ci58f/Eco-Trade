import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { CATEGORIES, CATEGORY_ICONS, INDIAN_CITIES } from '../utils/helpers';
import { ListingCard, SpinnerPage, EmptyState, PageHeader } from '../components/shared/index.jsx';

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', category: '', city: '', minPrice: '', maxPrice: '', sortBy: 'createdAt', order: 'desc' });
  const [page, setPage] = useState(1);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const params = { ...filters, page, limit: 12 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/listings', { params });
      setListings(data.data || []);
      setPagination(data.pagination || {});
    } catch { } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  return (
    <div className="p-6">
      <PageHeader title="Marketplace" subtitle="Browse available waste materials from publishers across India" />

      {/* Search + Filters */}
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <input className="input lg:col-span-2" placeholder="🔍 Search listings..." value={filters.search} onChange={e => handleFilter('search', e.target.value)} />
          <select className="input" value={filters.category} onChange={e => handleFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
          </select>
          <select className="input" value={filters.city} onChange={e => handleFilter('city', e.target.value)}>
            <option value="">All Cities</option>
            {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="input" type="number" placeholder="Min ₹" value={filters.minPrice} onChange={e => handleFilter('minPrice', e.target.value)} />
          <input className="input" type="number" placeholder="Max ₹" value={filters.maxPrice} onChange={e => handleFilter('maxPrice', e.target.value)} />
        </div>
        <div className="flex gap-3 mt-3">
          <select className="input w-48" value={`${filters.sortBy}_${filters.order}`} onChange={e => { const [s, o] = e.target.value.split('_'); handleFilter('sortBy', s); handleFilter('order', o); }}>
            <option value="createdAt_desc">Newest First</option>
            <option value="createdAt_asc">Oldest First</option>
            <option value="price.amount_asc">Price: Low to High</option>
            <option value="price.amount_desc">Price: High to Low</option>
            <option value="views_desc">Most Viewed</option>
          </select>
          <button onClick={() => { setFilters({ search: '', category: '', city: '', minPrice: '', maxPrice: '', sortBy: 'createdAt', order: 'desc' }); setPage(1); }} className="btn-secondary text-sm px-4">Clear Filters</button>
          {pagination.total && <span className="text-sm text-gray-500 self-center">{pagination.total} listings found</span>}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => handleFilter('category', '')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!filters.category ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#D8F3DC]'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => handleFilter('category', c)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filters.category === c ? 'bg-[#2D6A4F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-[#D8F3DC]'}`}>
            {CATEGORY_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {loading ? <SpinnerPage /> : listings.length === 0 ? (
        <EmptyState icon="🔍" title="No listings found" subtitle="Try adjusting your filters or search terms" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l, i) => <div key={l._id} className={`stagger-${(i % 4) + 1}`}><ListingCard listing={l} /></div>)}
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-4 disabled:opacity-40">← Prev</button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === p ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-[#D8F3DC]'}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-sm px-4 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
