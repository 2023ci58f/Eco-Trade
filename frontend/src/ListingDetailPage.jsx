import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, formatDate, CATEGORY_ICONS, STATUS_COLORS } from '../utils/helpers';
import { StarRating, StatusBadge, SpinnerPage } from '../components/shared/index.jsx';
import toast from 'react-hot-toast';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart() || {};
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [l, r] = await Promise.all([
          api.get(`/listings/${id}`),
          api.get(`/reviews/user/${id}`).catch(() => ({ data: { data: [] } })),
        ]);
        setListing(l.data.data);
        setReviews(r.data.data || []);
      } catch { navigate('/marketplace'); } finally { setLoading(false); }
    };
    fetch();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!user || user.role !== 'manufacturer') { toast.error('Only manufacturers can add to cart'); return; }
    try { await addToCart(listing._id, qty); toast.success('Added to cart!'); } catch { }
  };

  const handleContact = async () => {
    try {
      const { data } = await api.post('/chat/conversations', { participantId: listing.publisher._id, listingId: listing._id });
      navigate(`/chat/${data.data._id}`);
    } catch { }
  };

  if (loading) return <SpinnerPage />;
  if (!listing) return null;

  const imgs = listing.images?.length ? listing.images : [`https://picsum.photos/seed/${listing._id}/600/400`];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-[#2D6A4F] hover:underline text-sm mb-6 flex items-center gap-1">← Back to Marketplace</button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Images */}
        <div>
          <div className="rounded-2xl overflow-hidden bg-gray-100 h-80 mb-3">
            <img src={imgs[activeImg]} alt={listing.title} className="w-full h-full object-cover" onError={e => { e.target.src = `https://picsum.photos/seed/${listing._id}/600/400`; }} />
          </div>
          {imgs.length > 1 && (
            <div className="flex gap-2">
              {imgs.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-[#2D6A4F]' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start gap-2 mb-2">
            <span className="badge bg-[#D8F3DC] text-[#2D6A4F]">{CATEGORY_ICONS[listing.category]} {listing.category}</span>
            <StatusBadge status={listing.availability} />
            {listing.isFeatured && <span className="badge bg-amber-100 text-amber-800">⭐ Featured</span>}
          </div>
          <h1 className="text-2xl font-syne font-bold text-gray-900 mb-3">{listing.title}</h1>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-syne font-bold text-[#2D6A4F]">{formatCurrency(listing.price?.amount)}</span>
            <span className="text-gray-500">/{listing.price?.per}</span>
            {listing.price?.negotiable && <span className="badge bg-blue-100 text-blue-700">Negotiable</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Available Quantity</p>
              <p className="font-semibold text-gray-900">{listing.quantity?.value} {listing.quantity?.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Condition</p>
              <p className="font-semibold text-gray-900 capitalize">{listing.condition?.replace('-', ' ')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-semibold text-gray-900">📍 {listing.location?.city}, {listing.location?.state}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Posted On</p>
              <p className="font-semibold text-gray-900">{formatDate(listing.createdAt)}</p>
            </div>
          </div>

          {/* Pickup options */}
          <div className="flex gap-2 mb-6">
            {listing.pickupOptions?.selfPickup && <span className="badge bg-green-100 text-green-700">🚗 Self Pickup</span>}
            {listing.pickupOptions?.doorDelivery && <span className="badge bg-blue-100 text-blue-700">🚚 Door Delivery</span>}
            {listing.pickupOptions?.courierShipping && <span className="badge bg-purple-100 text-purple-700">📦 Courier</span>}
          </div>

          {user?.role === 'manufacturer' && listing.availability === 'available' && (
            <div className="flex gap-3 mb-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">−</button>
                <span className="px-4 py-2 font-medium">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="px-3 py-2 hover:bg-gray-100 transition-colors">+</button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex-1">🛒 Add to Cart</button>
            </div>
          )}

          <button onClick={handleContact} className="btn-secondary w-full">💬 Contact Publisher</button>
        </div>
      </div>

      {/* Description */}
      <div className="card mb-6">
        <h2 className="text-lg font-syne font-semibold mb-3">Description</h2>
        <p className="text-gray-600 leading-relaxed">{listing.description}</p>
        {listing.tags?.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {listing.tags.map(t => <span key={t} className="badge bg-gray-100 text-gray-600">#{t}</span>)}
          </div>
        )}
      </div>

      {/* Publisher */}
      <div className="card mb-6">
        <h2 className="text-lg font-syne font-semibold mb-4">About the Publisher</h2>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-[#D8F3DC] rounded-2xl flex items-center justify-center text-[#2D6A4F] font-bold text-xl">
            {listing.publisher?.name?.[0] || 'P'}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{listing.publisher?.name}</h3>
            {listing.publisher?.company && <p className="text-gray-500 text-sm">{listing.publisher.company}</p>}
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={listing.publisher?.rating || 0} size="sm" />
              <span className="text-sm text-gray-500">({listing.publisher?.totalReviews || 0} reviews)</span>
            </div>
            {listing.publisher?.bio && <p className="text-gray-600 text-sm mt-2">{listing.publisher.bio}</p>}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-syne font-semibold mb-4">Reviews ({reviews.length})</h2>
          <div className="space-y-4">
            {reviews.slice(0, 5).map(r => (
              <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] text-sm font-semibold">{r.reviewer?.name?.[0]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{r.reviewer?.name}</span>
                      <StarRating rating={r.rating} size="sm" />
                    </div>
                    {r.title && <p className="font-medium text-gray-800 text-sm mt-1">{r.title}</p>}
                    <p className="text-gray-600 text-sm mt-1">{r.comment}</p>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(r.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
