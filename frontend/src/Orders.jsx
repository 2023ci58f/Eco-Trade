import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { PageHeader, StatusBadge, EmptyState, SpinnerPage } from '../../components/shared/index.jsx';
import toast from 'react-hot-toast';

export default function PublisherOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdating(orderId);
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? data.data : o));
      toast.success(`Order ${status.replace(/_/g, ' ')}`);
    } catch { } finally { setUpdating(null); }
  };

  const nextActions = {
    pending: { status: 'confirmed', label: '✅ Confirm' },
    confirmed: { status: 'processing', label: '⚙️ Processing' },
    processing: { status: 'ready_for_pickup', label: '📦 Ready' },
    ready_for_pickup: { status: 'picked_up', label: '✅ Picked Up' },
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <SpinnerPage />;

  return (
    <div className="p-6">
      <PageHeader title="Incoming Orders" subtitle={`${orders.length} total order${orders.length !== 1 ? 's' : ''}`} />

      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'confirmed', 'processing', 'ready_for_pickup', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-[#D8F3DC]'}`}>
            {f.replace(/_/g, ' ')} {f !== 'all' && `(${orders.filter(o => o.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title="No orders found" subtitle="Orders from manufacturers will appear here" />
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order._id} className="card p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#D8F3DC] rounded-xl flex items-center justify-center text-[#2D6A4F] font-bold">{order.manufacturer?.name?.[0] || 'M'}</div>
                  <div>
                    <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">From: {order.manufacturer?.name}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-bold text-[#2D6A4F] text-lg">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {order.items?.slice(0, 3).map((item, i) => (
                  <span key={i} className="badge bg-gray-100 text-gray-600">{item.title} ×{item.quantity}</span>
                ))}
                {order.items?.length > 3 && <span className="badge bg-gray-100 text-gray-500">+{order.items.length - 3} more</span>}
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => navigate(`/orders/${order._id}`)} className="btn-secondary text-sm px-4">View Details</button>
                {nextActions[order.status] && (
                  <button
                    onClick={() => updateStatus(order._id, nextActions[order.status].status)}
                    disabled={updating === order._id}
                    className="btn-primary text-sm px-4"
                  >
                    {updating === order._id ? '...' : nextActions[order.status].label}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
