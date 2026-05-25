import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'manufacturer') return;
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data.data || { items: [] });
    } catch {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (listingId, quantity = 1) => {
    const { data } = await api.post('/cart/add', { listingId, quantity });
    setCart(data.data);
    return data;
  };

  const updateItem = async (listingId, quantity) => {
    const { data } = await api.put(`/cart/item/${listingId}`, { quantity });
    setCart(data.data);
  };

  const removeItem = async (listingId) => {
    const { data } = await api.delete(`/cart/item/${listingId}`);
    setCart(data.data);
  };

  const clearCart = async () => {
    await api.delete('/cart/clear');
    setCart({ items: [] });
  };

  const cartCount = cart?.items?.length || 0;
  const cartTotal = cart?.items?.reduce((sum, item) => {
    const price = item.listing?.price?.amount || 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateItem, removeItem, clearCart, cartCount, cartTotal, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
