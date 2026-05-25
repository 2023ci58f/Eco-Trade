import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import { CATEGORIES, INDIAN_STATES, INDIAN_CITIES } from '../../utils/helpers';
import { PageHeader, SpinnerPage } from '../../components/shared/index.jsx';
import toast from 'react-hot-toast';

function ListingForm({ defaultValues = {}, onSubmit, loading, title }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <PageHeader title={title} action={<button type="button" onClick={() => navigate('/publisher/listings')} className="btn-secondary text-sm">← Back</button>} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Min 5 characters' } })} className="input" placeholder="e.g. Industrial Aluminum Scrap - 500kg" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Min 20 characters' } })} className="input resize-none h-28" placeholder="Describe your waste material in detail: quality, origin, condition, sorting status..." />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category *</label>
                <select {...register('category', { required: 'Category is required' })} className="input">
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <label className="label">Condition *</label>
                <select {...register('condition')} className="input">
                  <option value="fresh">Fresh</option>
                  <option value="used">Used</option>
                  <option value="heavily-used">Heavily Used</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Tags (comma separated)</label>
              <input {...register('tagsInput')} className="input" placeholder="e.g. aluminum, scrap, bulk, industrial" />
            </div>
          </div>
        </div>

        {/* Quantity & Price */}
        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-4">Quantity & Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input {...register('quantity.value', { required: 'Required', min: { value: 1, message: 'Min 1' } })} type="number" className="input" placeholder="500" />
              {errors.quantity?.value && <p className="text-red-500 text-xs mt-1">{errors.quantity.value.message}</p>}
            </div>
            <div>
              <label className="label">Unit</label>
              <select {...register('quantity.unit')} className="input">
                {['kg', 'ton', 'litre', 'piece', 'bundle'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price *</label>
              <input {...register('price.amount', { required: 'Required', min: { value: 0, message: 'Must be 0 or more' } })} type="number" className="input" placeholder="25" />
              {errors.price?.amount && <p className="text-red-500 text-xs mt-1">{errors.price.amount.message}</p>}
            </div>
            <div>
              <label className="label">Price Per</label>
              <select {...register('price.per')} className="input">
                {['kg', 'ton', 'litre', 'piece', 'bundle', 'lot'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('price.negotiable')} type="checkbox" className="rounded" />
              <span className="text-sm text-gray-600">Price is negotiable</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-4">Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City *</label>
              <input {...register('location.city', { required: 'City required' })} className="input" list="cities" placeholder="Mumbai" />
              <datalist id="cities">{INDIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
              {errors.location?.city && <p className="text-red-500 text-xs mt-1">{errors.location.city.message}</p>}
            </div>
            <div>
              <label className="label">State *</label>
              <select {...register('location.state', { required: 'State required' })} className="input">
                <option value="">Select state</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.location?.state && <p className="text-red-500 text-xs mt-1">{errors.location.state.message}</p>}
            </div>
            <div>
              <label className="label">Pincode</label>
              <input {...register('location.pincode')} className="input" placeholder="400001" />
            </div>
            <div>
              <label className="label">Address / Area</label>
              <input {...register('location.address')} className="input" placeholder="Industrial area, sector 5" />
            </div>
          </div>
        </div>

        {/* Pickup options */}
        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-4">Pickup Options</h2>
          <div className="space-y-2">
            {[['pickupOptions.selfPickup', 'Self Pickup (buyer collects)'], ['pickupOptions.doorDelivery', 'Door Delivery (I will deliver)'], ['pickupOptions.courierShipping', 'Courier Shipping']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input {...register(key)} type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Image URLs */}
        <div className="card">
          <h2 className="font-syne font-semibold text-lg mb-2">Image URLs</h2>
          <p className="text-gray-500 text-sm mb-4">Enter public image URLs (upload to AWS S3 or Cloudinary first)</p>
          {[0, 1, 2].map(i => (
            <div key={i} className="mb-3">
              <label className="label">Image {i + 1} URL {i === 0 ? '(Main)' : '(Optional)'}</label>
              <input {...register(`images.${i}`)} className="input" placeholder="https://..." type="url" />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Saving...' : '💾 Save Listing'}
          </button>
          <button type="button" onClick={() => navigate('/publisher/listings')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export function AddListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (data.tagsInput) data.tags = data.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      if (data.images) data.images = data.images.filter(Boolean);
      await api.post('/listings', data);
      toast.success('Listing created!');
      navigate('/publisher/listings');
    } catch { } finally { setLoading(false); }
  };

  return <ListingForm title="Add New Listing" onSubmit={onSubmit} loading={loading} defaultValues={{ 'pickupOptions.selfPickup': true, 'price.negotiable': true, 'quantity.unit': 'kg', 'price.per': 'kg', condition: 'used' }} />;
}

export function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [defaults, setDefaults] = useState(null);

  useEffect(() => {
    api.get(`/listings/${id}`).then(r => {
      const l = r.data.data;
      setDefaults({
        title: l.title, description: l.description, category: l.category, condition: l.condition,
        'quantity.value': l.quantity?.value, 'quantity.unit': l.quantity?.unit,
        'price.amount': l.price?.amount, 'price.per': l.price?.per, 'price.negotiable': l.price?.negotiable,
        'location.city': l.location?.city, 'location.state': l.location?.state, 'location.pincode': l.location?.pincode, 'location.address': l.location?.address,
        'pickupOptions.selfPickup': l.pickupOptions?.selfPickup, 'pickupOptions.doorDelivery': l.pickupOptions?.doorDelivery, 'pickupOptions.courierShipping': l.pickupOptions?.courierShipping,
        tagsInput: l.tags?.join(', ') || '',
        'images.0': l.images?.[0] || '', 'images.1': l.images?.[1] || '', 'images.2': l.images?.[2] || '',
      });
    }).catch(() => navigate('/publisher/listings')).finally(() => setFetching(false));
  }, [id]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (data.tagsInput) data.tags = data.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      if (data.images) data.images = data.images.filter(Boolean);
      await api.put(`/listings/${id}`, data);
      toast.success('Listing updated!');
      navigate('/publisher/listings');
    } catch { } finally { setLoading(false); }
  };

  if (fetching) return <SpinnerPage />;
  return <ListingForm title="Edit Listing" onSubmit={onSubmit} loading={loading} defaultValues={defaults || {}} />;
}

export default AddListing;
