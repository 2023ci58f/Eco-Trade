import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { StatCard, PageHeader, SpinnerPage } from '../../components/shared/index.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/orders')]).then(([s, o]) => {
      setStats(s.data.data);
      setRecentOrders((o.data.data || []).slice(0, 10));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <SpinnerPage />;

  const userCounts = stats?.users || [];
  const publishers = userCounts.find(u => u._id === 'publisher')?.count || 0;
  const manufacturers = userCounts.find(u => u._id === 'manufacturer')?.count || 0;
  const totalRevenue = (stats?.orders || []).reduce((s, o) => s + (o.revenue || 0), 0);
  const totalOrders = (stats?.orders || []).reduce((s, o) => s + o.count, 0);

  const orderStatusData = (stats?.orders || []).map(o => ({ name: o._id?.replace(/_/g, ' '), count: o.count, revenue: o.revenue }));

  return (
    <div className="p-6">
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📤" label="Publishers" value={publishers} color="blue" />
        <StatCard icon="🏭" label="Manufacturers" value={manufacturers} color="purple" />
        <StatCard icon="📋" label="Active Listings" value={stats?.listings || 0} color="green" />
        <StatCard icon="💰" label="Total Revenue" value={formatCurrency(totalRevenue)} sub={`${totalOrders} orders`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={orderStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#52B788" radius={[4,4,0,0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-4">Revenue by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={orderStatusData.filter(d => d.revenue > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#2D6A4F" radius={[4,4,0,0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-syne font-semibold text-lg mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Order #</th>
                <th className="pb-3 font-medium">Manufacturer</th>
                <th className="pb-3 font-medium">Publisher</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(o => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-[#2D6A4F]">#{o.orderNumber}</td>
                  <td className="py-3 text-gray-700">{o.manufacturer?.name}</td>
                  <td className="py-3 text-gray-700">{o.publisher?.name}</td>
                  <td className="py-3 font-medium">{formatCurrency(o.totalAmount)}</td>
                  <td className="py-3"><span className={`badge ${{'pending':'bg-yellow-100 text-yellow-800','delivered':'bg-green-100 text-green-800','cancelled':'bg-red-100 text-red-800'}[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
