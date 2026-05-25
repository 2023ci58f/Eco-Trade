import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/helpers';
import { PageHeader, EmptyState, SpinnerPage } from '../components/shared/index.jsx';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (loading) return <SpinnerPage />;

  const items = cart?.items || [];
  const tax = Math.round(cartTotal * 0.18);
  const total = cartTotal + tax;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Shopping Cart"
        subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} in your cart`}
        action={items.length > 0 && <button onClick={() => { clearCart(); toast.success('Cart cleared'); }} className="btn-secondary text-sm">Clear Cart</button>}
      />

      {items.length === 0 ? (
        <EmptyState icon="🛒" title="Your cart is empty" subtitle="Browse the marketplace to add waste materials" action={<button onClick={() => navigate('/marketplace')} className="btn-primary">Browse Marketplace</button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const listing = item.listing;
              if (!listing) return null;
              const img = listing.images?.[0] || `https://picsum.photos/seed/${listing._id}/200/150`;
              const itemTotal = listing.price?.amount * item.quantity;
              return (
                <div key={item._id} className="card p-4 flex gap-4">
                  <img src={img} alt={listing.title} className="w-24 h-24 object-cover rounded-xl flex-shrink-0" onError={e => { e.target.src = `https://picsum.photos/seed/${listing._id}/200/150`; }} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 hover:text-[#2D6A4F] cursor-pointer" onClick={() => navigate(`/marketplace/${listing._id}`)}>{listing.title}</h3>
                        <p className="text-gray-500 text-sm">{listing.category}</p>
                        <p className="text-[#2D6A4F] font-medium mt-1">{formatCurrency(listing.price?.amount)}/{listing.price?.per}</p>
                      </div>
                      <button onClick={() => { removeItem(listing._id); toast.success('Item removed'); }} className="text-red-400 hover:text-red-600 text-sm transition-colors">✕</button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => item.quantity > 1 ? updateItem(listing._id, item.quantity - 1) : removeItem(listing._id)} className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-sm">−</button>
                        <span className="px-3 py-1.5 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateItem(listing._id, item.quantity + 1)} className="px-3 py-1.5 hover:bg-gray-100 transition-colors text-sm">+</button>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(itemTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="card h-fit sticky top-6">
            <h2 className="font-syne font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatCurrency(cartTotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>{formatCurrency(tax)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="text-green-600">Calculated at checkout</span></div>
            </div>
            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="flex justify-between font-semibold text-gray-900"><span>Total</span><span className="text-[#2D6A4F]">{formatCurrency(total)}</span></div>
              <p className="text-xs text-gray-400 mt-1">* Excluding delivery charges</p>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary w-full">Proceed to Checkout →</button>
            <button onClick={() => navigate('/marketplace')} className="btn-secondary w-full mt-3">Continue Shopping</button>
          </div>
        </div>
      )}
    </div>
  );
}
