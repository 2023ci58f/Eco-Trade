import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, STATUS_COLORS } from '../../utils/helpers';
import { StatCard, PageHeader, StatusBadge, SpinnerPage } from '../../components/shared/index.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function PublisherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/listings/my'), api.get('/orders?limit=5')]).then(([l, o]) => {
      setListings(l.data.data || []);
      setOrders(o.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SpinnerPage />;

  const activeListings = listings.filter(l => l.isActive && l.availability === 'available').length;
  const totalViews = listings.reduce((s, l) => s + (l.views || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0);

  const categoryData = listings.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(categoryData).map(([name, count]) => ({ name: name.split(' ')[0], count }));

  return (
    <div className="p-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}! 👋`}
        subtitle="Here's an overview of your waste marketplace activity"
        action={<button onClick={() => navigate('/publisher/listings/add')} className="btn-primary">+ Add Listing</button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📋" label="Active Listings" value={activeListings} sub={`${listings.length} total`} color="green" />
        <StatCard icon="📦" label="Pending Orders" value={pendingOrders} sub="Need attention" color="amber" />
        <StatCard icon="👁" label="Total Views" value={totalViews.toLocaleString()} sub="Across all listings" color="blue" />
        <StatCard icon="💰" label="Revenue Earned" value={formatCurrency(totalRevenue)} sub="From delivered orders" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category distribution */}
        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-4">Listings by Category</h2>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No listings yet. <button onClick={() => navigate('/publisher/listings/add')} className="text-[#2D6A4F] ml-1 hover:underline">Add one →</button></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#52B788" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-semibold text-lg">Recent Orders</h2>
            <button onClick={() => navigate('/publisher/orders')} className="text-[#2D6A4F] text-sm hover:underline">View all →</button>
          </div>
          {orders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div key={order._id} onClick={() => navigate(`/orders/${order._id}`)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="w-9 h-9 bg-[#D8F3DC] rounded-xl flex items-center justify-center text-[#2D6A4F] text-xs font-bold">{order.manufacturer?.name?.[0] || 'M'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.manufacturer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#2D6A4F]">{formatCurrency(order.totalAmount)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My listings preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne font-semibold text-lg">My Listings</h2>
          <button onClick={() => navigate('/publisher/listings')} className="text-[#2D6A4F] text-sm hover:underline">Manage all →</button>
        </div>
        {listings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">No listings yet. Start publishing your waste materials!</p>
            <button onClick={() => navigate('/publisher/listings/add')} className="btn-primary text-sm">+ Add First Listing</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.slice(0, 8).map(l => (
                  <tr key={l._id} onClick={() => navigate(`/publisher/listings`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="py-3 font-medium text-gray-900 max-w-xs truncate">{l.title}</td>
                    <td className="py-3 text-gray-500">{l.category}</td>
                    <td className="py-3 text-[#2D6A4F] font-medium">{formatCurrency(l.price?.amount)}/{l.price?.per}</td>
                    <td className="py-3"><StatusBadge status={l.availability} /></td>
                    <td className="py-3 text-gray-500">{l.views || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
