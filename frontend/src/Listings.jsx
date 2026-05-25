import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate, CATEGORY_ICONS } from '../../utils/helpers';
import { PageHeader, StatusBadge, EmptyState, SpinnerPage } from '../../components/shared/index.jsx';
import toast from 'react-hot-toast';

export default function PublisherListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/listings/my').then(r => setListings(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings(prev => prev.filter(l => l._id !== id));
      toast.success('Listing removed');
    } catch { }
  };

  const filtered = filter === 'all' ? listings : listings.filter(l => l.availability === filter);

  if (loading) return <SpinnerPage />;

  return (
    <div className="p-6">
      <PageHeader
        title="My Listings"
        subtitle={`${listings.length} total listing${listings.length !== 1 ? 's' : ''}`}
        action={<button onClick={() => navigate('/publisher/listings/add')} className="btn-primary">+ Add New Listing</button>}
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'available', 'reserved', 'sold'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-[#D8F3DC]'}`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📋" title="No listings found" subtitle={filter === 'all' ? 'Add your first listing to start selling waste materials' : `No ${filter} listings`}
          action={filter === 'all' && <button onClick={() => navigate('/publisher/listings/add')} className="btn-primary">+ Add Listing</button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(listing => {
            const img = listing.images?.[0] || `https://picsum.photos/seed/${listing._id}/200/150`;
            return (
              <div key={listing._id} className="card p-4 flex gap-4 hover:shadow-hover transition-shadow">
                <img src={img} alt={listing.title} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" onError={e => { e.target.src = `https://picsum.photos/seed/${listing._id}/200/150`; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                      <p className="text-gray-500 text-sm">{CATEGORY_ICONS[listing.category]} {listing.category}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={listing.availability} />
                      {listing.isFeatured && <span className="badge bg-amber-100 text-amber-800">⭐ Featured</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-2 text-sm">
                    <span className="text-[#2D6A4F] font-semibold">{formatCurrency(listing.price?.amount)}/{listing.price?.per}</span>
                    <span className="text-gray-500">📦 {listing.quantity?.value} {listing.quantity?.unit}</span>
                    <span className="text-gray-500">📍 {listing.location?.city}</span>
                    <span className="text-gray-500">👁 {listing.views || 0} views</span>
                    <span className="text-gray-400 text-xs">Added {formatDate(listing.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/marketplace/${listing._id}`)} className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">👁 View</button>
                  <button onClick={() => navigate(`/publisher/listings/edit/${listing._id}`)} className="text-xs px-3 py-1.5 rounded-xl border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC] transition-colors">✏️ Edit</button>
                  <button onClick={() => handleDelete(listing._id)} className="text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">🗑 Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
