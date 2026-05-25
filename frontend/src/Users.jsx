import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { PageHeader, StatusBadge, SpinnerPage, EmptyState } from '../../components/shared/index.jsx';
import toast from 'react-hot-toast';

// ── Admin Users ───────────────────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const toggleBan = async (userId, ban) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/ban`, { ban });
      setUsers(prev => prev.map(u => u._id === userId ? data.data : u));
      toast.success(ban ? 'User banned' : 'User unbanned');
    } catch { }
  };

  const filtered = users.filter(u => {
    const matchRole = filter === 'all' || u.role === filter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  if (loading) return <SpinnerPage />;

  return (
    <div className="p-6">
      <PageHeader title="User Management" subtitle={`${users.length} registered users`} />
      <div className="flex gap-3 mb-6 flex-wrap">
        {['all', 'publisher', 'manufacturer', 'admin'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${filter === f ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-[#D8F3DC]'}`}>{f}</button>
        ))}
        <input className="input w-64 ml-auto" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Company</th>
              <th className="pb-3 font-medium">Joined</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-900">{u.name}</td>
                <td className="py-3 text-gray-600">{u.email}</td>
                <td className="py-3"><span className={`badge capitalize ${u.role === 'publisher' ? 'bg-blue-100 text-blue-700' : u.role === 'manufacturer' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>{u.role}</span></td>
                <td className="py-3 text-gray-600">{u.company || '—'}</td>
                <td className="py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                <td className="py-3"><span className={`badge ${u.isBanned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{u.isBanned ? 'Banned' : 'Active'}</span></td>
                <td className="py-3">
                  {u.role !== 'admin' && (
                    <button onClick={() => toggleBan(u._id, !u.isBanned)} className={`text-xs px-3 py-1 rounded-lg border transition-colors ${u.isBanned ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon="👥" title="No users found" subtitle="Try changing your filters" />}
      </div>
    </div>
  );
}

// ── Admin Listings ────────────────────────────────────────────────────────────
export function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/listings').then(r => setListings(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const toggleFeature = async (id, featured) => {
    try {
      const { data } = await api.put(`/admin/listings/${id}/feature`, { featured });
      setListings(prev => prev.map(l => l._id === id ? data.data : l));
      toast.success(featured ? 'Listing featured!' : 'Feature removed');
    } catch { }
  };

  const removeListing = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings(prev => prev.filter(l => l._id !== id));
      toast.success('Listing removed');
    } catch { }
  };

  if (loading) return <SpinnerPage />;

  return (
    <div className="p-6">
      <PageHeader title="Listings Management" subtitle={`${listings.length} total listings`} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">Title</th>
              <th className="pb-3 font-medium">Publisher</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Featured</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {listings.map(l => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-900 max-w-xs truncate">{l.title}</td>
                <td className="py-3 text-gray-600">{l.publisher?.name}</td>
                <td className="py-3 text-gray-500">{l.category}</td>
                <td className="py-3 font-medium text-[#2D6A4F]">{formatCurrency(l.price?.amount)}/{l.price?.per}</td>
                <td className="py-3"><StatusBadge status={l.availability} /></td>
                <td className="py-3">{l.isFeatured ? '⭐ Yes' : '—'}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleFeature(l._id, !l.isFeatured)} className="text-xs px-2 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors">
                      {l.isFeatured ? 'Unfeature' : '⭐ Feature'}
                    </button>
                    <button onClick={() => removeListing(l._id)} className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Admin Orders ──────────────────────────────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/orders').then(r => setOrders(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const resolveDispute = async (id, resolution) => {
    try {
      await api.put(`/admin/orders/${id}/resolve-dispute`, { resolution });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, isDisputed: false, status: resolution } : o));
      toast.success('Dispute resolved');
    } catch { }
  };

  const filtered = filter === 'all' ? orders : filter === 'disputed' ? orders.filter(o => o.isDisputed) : orders.filter(o => o.status === filter);

  if (loading) return <SpinnerPage />;

  return (
    <div className="p-6">
      <PageHeader title="Order Management" subtitle={`${orders.length} total orders`} />
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'disputed', 'pending', 'confirmed', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${filter === f ? 'bg-[#2D6A4F] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-[#D8F3DC]'}`}>
            {f} {f === 'disputed' && `(${orders.filter(o => o.isDisputed).length})`}
          </button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">Order #</th>
              <th className="pb-3 font-medium">Manufacturer</th>
              <th className="pb-3 font-medium">Publisher</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(o => (
              <tr key={o._id} className={`hover:bg-gray-50 ${o.isDisputed ? 'bg-red-50' : ''}`}>
                <td className="py-3 font-medium text-[#2D6A4F]">#{o.orderNumber} {o.isDisputed && '🚨'}</td>
                <td className="py-3 text-gray-700">{o.manufacturer?.name}</td>
                <td className="py-3 text-gray-700">{o.publisher?.name}</td>
                <td className="py-3 font-semibold">{formatCurrency(o.totalAmount)}</td>
                <td className="py-3"><StatusBadge status={o.status} /></td>
                <td className="py-3">
                  {o.isDisputed && (
                    <div className="flex gap-2">
                      <button onClick={() => resolveDispute(o._id, 'delivered')} className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200">Resolve: Delivered</button>
                      <button onClick={() => resolveDispute(o._id, 'cancelled')} className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Resolve: Cancel</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon="📦" title="No orders found" subtitle="Try changing your filters" />}
      </div>
    </div>
  );
}

export default AdminUsers;
