import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, INDIAN_STATES, INDIAN_CITIES } from '../utils/helpers';
import { PageHeader, SpinnerPage } from '../components/shared/index.jsx';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pickupType, setPickupType] = useState('self_pickup');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone || '', address: '', city: user?.address?.city || '', state: user?.address?.state || '', pincode: '' }
  });

  const items = cart?.items || [];
  const tax = Math.round(cartTotal * 0.18);
  const delivery = pickupType === 'door_delivery' ? 500 : 0;
  const total = cartTotal + tax + delivery;

  const onSubmit = async (formData) => {
    if (!items.length) { toast.error('Cart is empty'); return; }
    try {
      setLoading(true);
      const orderItems = items.map(item => ({ listingId: item.listing._id, quantity: item.quantity }));
      const { data } = await api.post('/orders', {
        items: orderItems,
        shippingAddress: formData,
        pickupType,
        payment: { method: paymentMethod },
        notes: formData.notes,
      });
      await clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  if (!items.length) { navigate('/cart'); return <SpinnerPage />; }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Checkout" subtitle="Complete your order" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping address */}
            <div className="card">
              <h2 className="font-syne font-semibold text-lg mb-4">📍 Shipping / Pickup Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...register('name', { required: 'Required' })} className="input" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input {...register('phone', { required: 'Required' })} className="input" placeholder="+91 98765 43210" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input {...register('address', { required: 'Required' })} className="input" placeholder="Street, area" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="label">City</label>
                  <input {...register('city', { required: 'Required' })} className="input" list="cities" />
                  <datalist id="cities">{INDIAN_CITIES.map(c => <option key={c} value={c} />)}</datalist>
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="label">State</label>
                  <select {...register('state', { required: 'Required' })} className="input">
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input {...register('pincode', { required: 'Required' })} className="input" placeholder="400001" />
                  {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                </div>
              </div>
            </div>

            {/* Pickup type */}
            <div className="card">
              <h2 className="font-syne font-semibold text-lg mb-4">🚚 Pickup / Delivery Method</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { type: 'self_pickup', icon: '🚗', label: 'Self Pickup', desc: 'Free' },
                  { type: 'door_delivery', icon: '🚚', label: 'Door Delivery', desc: '₹500' },
                  { type: 'courier', icon: '📦', label: 'Courier', desc: 'As applicable' },
                ].map(({ type, icon, label, desc }) => (
                  <button key={type} type="button" onClick={() => setPickupType(type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${pickupType === type ? 'border-[#2D6A4F] bg-[#D8F3DC]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="card">
              <h2 className="font-syne font-semibold text-lg mb-4">💳 Payment Method</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { method: 'cod', icon: '💵', label: 'Cash on Delivery' },
                  { method: 'online', icon: '💳', label: 'Online Payment' },
                  { method: 'bank_transfer', icon: '🏦', label: 'Bank Transfer' },
                ].map(({ method, icon, label }) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === method ? 'border-[#2D6A4F] bg-[#D8F3DC]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="font-semibold text-sm">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <label className="label">📝 Special Notes (optional)</label>
              <textarea {...register('notes')} className="input resize-none h-20" placeholder="Any special instructions for the publisher..." />
            </div>
          </div>

          {/* Order summary */}
          <div className="card h-fit sticky top-6">
            <h2 className="font-syne font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map(item => item.listing && (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">{item.listing.title} ×{item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.listing.price?.amount * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>{formatCurrency(tax)}</span></div>
              {delivery > 0 && <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{formatCurrency(delivery)}</span></div>}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span><span className="text-[#2D6A4F]">{formatCurrency(total)}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Placing Order...' : `Place Order • ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
