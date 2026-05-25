import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime, STATUS_COLORS } from '../utils/helpers';
import { StatusBadge, StarRating, SpinnerPage } from '../components/shared/index.jsx';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending','confirmed','processing','ready_for_pickup','picked_up','in_transit','delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data.data)).catch(() => navigate('/marketplace')).finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status, note = '') => {
    try {
      setUpdating(true);
      const { data } = await api.put(`/orders/${id}/status`, { status, note });
      setOrder(data.data);
      toast.success(`Order marked as ${status.replace(/_/g, ' ')}`);
    } catch { } finally { setUpdating(false); }
  };

  const submitReview = async () => {
    try {
      await api.post('/reviews', { orderId: order._id, ...review });
      toast.success('Review submitted!');
      setShowReview(false);
    } catch { }
  };

  const contactParty = async () => {
    const otherId = user.role === 'manufacturer' ? order.publisher._id : order.manufacturer._id;
    const { data } = await api.post('/chat/conversations', { participantId: otherId });
    navigate(`/chat/${data.data._id}`);
  };

  if (loading) return <SpinnerPage />;
  if (!order) return null;

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const publisherActions = [
    { status: 'confirmed', label: '✅ Confirm Order', show: order.status === 'pending' },
    { status: 'processing', label: '⚙️ Mark Processing', show: order.status === 'confirmed' },
    { status: 'ready_for_pickup', label: '📦 Ready for Pickup', show: order.status === 'processing' },
    { status: 'picked_up', label: '✅ Mark Picked Up', show: order.status === 'ready_for_pickup' },
  ];
  const manufacturerActions = [
    { status: 'cancelled', label: '❌ Cancel Order', show: ['pending', 'confirmed'].includes(order.status), danger: true },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-[#2D6A4F] hover:underline text-sm mb-6">← Back</button>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-syne font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <StatusBadge status={order.status} />
            <button onClick={contactParty} className="btn-secondary text-sm">💬 Chat</button>
          </div>
        </div>

        {/* Progress bar */}
        {!['cancelled','disputed'].includes(order.status) && (
          <div className="mt-6">
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= currentStepIdx ? 'bg-[#2D6A4F] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {i < currentStepIdx ? '✓' : i + 1}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 text-center hidden sm:block w-16">{step.replace(/_/g, ' ')}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 transition-all ${i < currentStepIdx ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card">
            <h2 className="font-syne font-semibold mb-4">Order Items</h2>
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                <img src={item.listing?.images?.[0] || `https://picsum.photos/seed/${i}/80/60`} alt={item.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-gray-500 text-sm">{item.quantity} {item.unit} × {formatCurrency(item.pricePerUnit)}</p>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
            <div className="pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatCurrency(order.tax)}</span></div>
              {order.deliveryCharge > 0 && <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{formatCurrency(order.deliveryCharge)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span className="text-[#2D6A4F]">{formatCurrency(order.totalAmount)}</span></div>
            </div>
          </div>

          {/* Status history */}
          <div className="card">
            <h2 className="font-syne font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-3">
              {order.statusHistory?.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 bg-[#2D6A4F] rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium capitalize text-gray-900">{h.status?.replace(/_/g, ' ')}</p>
                    {h.note && <p className="text-xs text-gray-500">{h.note}</p>}
                    <p className="text-xs text-gray-400">{formatDateTime(h.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Parties */}
          <div className="card">
            <h2 className="font-syne font-semibold mb-3">Parties</h2>
            {[{ label: 'Publisher', party: order.publisher }, { label: 'Manufacturer', party: order.manufacturer }].map(({ label, party }) => (
              <div key={label} className="mb-3 last:mb-0">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] text-xs font-bold">{party?.name?.[0]}</div>
                  <div>
                    <p className="text-sm font-medium">{party?.name}</p>
                    <p className="text-xs text-gray-500">{party?.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping */}
          <div className="card">
            <h2 className="font-syne font-semibold mb-3">Shipping Info</h2>
            <p className="text-sm text-gray-600">{order.shippingAddress?.name}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress?.address}</p>
            <p className="text-sm text-gray-600">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
            <p className="text-xs text-gray-400 mt-2 capitalize">Method: {order.pickupType?.replace(/_/g, ' ')}</p>
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="font-syne font-semibold mb-3">Actions</h2>
            <div className="space-y-2">
              {(user?.role === 'publisher' ? publisherActions : manufacturerActions).filter(a => a.show).map(action => (
                <button key={action.status} onClick={() => updateStatus(action.status)} disabled={updating}
                  className={`w-full text-sm py-2 px-4 rounded-xl font-medium transition-all disabled:opacity-60 ${action.danger ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'btn-primary'}`}>
                  {action.label}
                </button>
              ))}
              {order.status === 'delivered' && !showReview && (
                <button onClick={() => setShowReview(true)} className="w-full btn-secondary text-sm">⭐ Leave Review</button>
              )}
            </div>
          </div>

          {/* Review form */}
          {showReview && (
            <div className="card">
              <h2 className="font-syne font-semibold mb-3">Write a Review</h2>
              <div className="mb-3">
                <label className="label">Rating</label>
                <StarRating rating={review.rating} size="lg" interactive onChange={r => setReview(v => ({ ...v, rating: r }))} />
              </div>
              <input className="input mb-2" placeholder="Review title" value={review.title} onChange={e => setReview(v => ({ ...v, title: e.target.value }))} />
              <textarea className="input resize-none h-20 mb-3" placeholder="Share your experience..." value={review.comment} onChange={e => setReview(v => ({ ...v, comment: e.target.value }))} />
              <button onClick={submitReview} className="btn-primary w-full text-sm">Submit Review</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
