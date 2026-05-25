import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getInitials, INDIAN_STATES, INDIAN_CITIES } from '../utils/helpers';
import { StarRating, SpinnerPage } from '../components/shared/index.jsx';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const isOwn = !userId || userId === currentUser?._id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const id = userId || currentUser?._id;
        const [p, r] = await Promise.all([
          isOwn ? api.get('/users/profile') : api.get(`/users/${id}/public`),
          api.get(`/reviews/user/${id}`).catch(() => ({ data: { data: [] } })),
        ]);
        const userData = p.data.data || p.data.user;
        setProfile(userData);
        setForm({ name: userData.name, phone: userData.phone || '', company: userData.company || '', bio: userData.bio || '', 'address.city': userData.address?.city || '', 'address.state': userData.address?.state || '' });
        setReviews(r.data.data || []);
      } catch { } finally { setLoading(false); }
    };
    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name: form.name, phone: form.phone, company: form.company, bio: form.bio,
        address: { city: form['address.city'], state: form['address.state'] },
      };
      const { data } = await api.put('/users/profile', payload);
      setProfile(data.data);
      updateUser(data.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { } finally { setSaving(false); }
  };

  if (loading) return <SpinnerPage />;
  if (!profile) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile card */}
        <div className="card text-center">
          <div className="w-20 h-20 bg-[#D8F3DC] rounded-2xl flex items-center justify-center text-[#2D6A4F] text-3xl font-syne font-bold mx-auto mb-4">
            {getInitials(profile.name)}
          </div>
          <h2 className="font-syne font-bold text-xl">{profile.name}</h2>
          {profile.company && <p className="text-gray-500 text-sm mt-1">{profile.company}</p>}
          <span className={`badge mt-2 ${profile.role === 'publisher' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {profile.role}
          </span>
          <div className="flex items-center justify-center gap-2 mt-3">
            <StarRating rating={profile.rating || 0} size="md" />
            <span className="text-sm text-gray-500">({profile.totalReviews || 0})</span>
          </div>
          {profile.address?.city && <p className="text-gray-500 text-sm mt-2">📍 {profile.address.city}, {profile.address.state}</p>}
          {isOwn && !editing && <button onClick={() => setEditing(true)} className="btn-secondary w-full mt-4 text-sm">✏️ Edit Profile</button>}
        </div>

        {/* Right: details */}
        <div className="lg:col-span-2 space-y-6">
          {editing ? (
            <div className="card">
              <h2 className="font-syne font-semibold text-lg mb-4">Edit Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Full Name' },
                  { key: 'company', label: 'Company' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'address.city', label: 'City' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input className="input" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label className="label">State</label>
                  <select className="input" value={form['address.state'] || ''} onChange={e => setForm(f => ({ ...f, 'address.state': e.target.value }))}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Bio</label>
                  <textarea className="input resize-none h-20" value={form.bio || ''} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell others about yourself..." />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
                <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 className="font-syne font-semibold text-lg mb-4">About</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Email</p><p className="font-medium">{profile.email || '—'}</p></div>
                <div><p className="text-gray-500">Phone</p><p className="font-medium">{profile.phone || '—'}</p></div>
                <div><p className="text-gray-500">Member Since</p><p className="font-medium">{formatDate(profile.createdAt)}</p></div>
                <div><p className="text-gray-500">Status</p><p className={`font-medium ${profile.isVerified ? 'text-green-600' : 'text-gray-500'}`}>{profile.isVerified ? '✅ Verified' : 'Unverified'}</p></div>
              </div>
              {profile.bio && <p className="text-gray-600 mt-4 text-sm">{profile.bio}</p>}
            </div>
          )}

          {/* Reviews */}
          <div className="card">
            <h2 className="font-syne font-semibold text-lg mb-4">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] text-sm font-semibold">{r.reviewer?.name?.[0]}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{r.reviewer?.name}</span>
                          <StarRating rating={r.rating} size="sm" />
                        </div>
                        {r.title && <p className="font-medium text-sm mt-0.5">{r.title}</p>}
                        <p className="text-gray-600 text-sm">{r.comment}</p>
                        <p className="text-gray-400 text-xs mt-1">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
