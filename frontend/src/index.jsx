import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, truncate, STATUS_COLORS, CATEGORY_ICONS } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ rating = 0, size = 'sm', interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  const sz = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <div className="flex items-center gap-0.5">
      {stars.map(s => (
        <span
          key={s}
          className={`${sz} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => interactive && onChange && onChange(s)}
        >
          {s <= Math.round(rating) ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ── ListingCard ───────────────────────────────────────────────────────────────
export function ListingCard({ listing, onAddToCart }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart() || {};

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user || user.role !== 'manufacturer') {
      toast.error('Only manufacturers can add to cart');
      return;
    }
    try {
      await addToCart(listing._id, 1);
      toast.success('Added to cart!');
    } catch { }
  };

  const img = listing.images?.[0] || `https://picsum.photos/seed/${listing._id}/400/300`;

  return (
    <div
      onClick={() => navigate(`/marketplace/${listing._id}`)}
      className="bg-white rounded-2xl shadow-card hover:shadow-hover transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100 animate-fadeInUp"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={img}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => { e.target.src = `https://picsum.photos/seed/${listing._id}/400/300`; }}
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="badge bg-white/90 backdrop-blur text-gray-700 shadow-sm">
            {CATEGORY_ICONS[listing.category]} {listing.category}
          </span>
          {listing.isFeatured && (
            <span className="badge bg-amber-400 text-amber-900">Featured</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`badge ${STATUS_COLORS[listing.availability]}`}>
            {listing.availability}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-syne font-semibold text-gray-900 mb-1 group-hover:text-[#2D6A4F] transition-colors line-clamp-1">
          {listing.title}
        </h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{listing.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[#2D6A4F] font-bold text-lg">{formatCurrency(listing.price?.amount)}</span>
            <span className="text-gray-400 text-xs ml-1">/{listing.price?.per}</span>
          </div>
          <span className="text-gray-500 text-sm">
            {listing.quantity?.value} {listing.quantity?.unit}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>📍 {listing.location?.city}, {listing.location?.state}</span>
          <span>👁 {listing.views || 0} views</span>
        </div>

        {/* Publisher info */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <div className="w-7 h-7 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] text-xs font-semibold">
            {listing.publisher?.name?.[0] || 'P'}
          </div>
          <span className="text-xs text-gray-600 flex-1 truncate">{listing.publisher?.name || 'Publisher'}</span>
          <StarRating rating={listing.publisher?.rating || 0} size="sm" />
        </div>

        {user?.role === 'manufacturer' && listing.availability === 'available' && (
          <button
            onClick={handleAddToCart}
            className="mt-3 w-full btn-primary py-2 text-sm"
          >
            🛒 Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-syne font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color = 'green' }) {
  const colors = {
    green: 'bg-[#D8F3DC] text-[#2D6A4F]',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <div className="card animate-fadeInUp">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{label}</p>
          <p className="text-2xl font-syne font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-syne font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">{subtitle}</p>
      {action}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-[#D8F3DC] border-t-[#2D6A4F] rounded-full animate-spin`} />
  );
}

export function SpinnerPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  );
}
