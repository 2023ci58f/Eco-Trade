import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetailPage from './pages/ListingDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';

// Publisher Pages
import PublisherDashboard from './pages/publisher/Dashboard';
import PublisherListings from './pages/publisher/Listings';
import PublisherOrders from './pages/publisher/Orders';
import AddListing from './pages/publisher/AddListing';
import EditListing from './pages/publisher/EditListing';

// Manufacturer Pages
import ManufacturerDashboard from './pages/manufacturer/Dashboard';
import ManufacturerOrders from './pages/manufacturer/Orders';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminListings from './pages/admin/Listings';
import AdminOrders from './pages/admin/Orders';

// Shared
import Layout from './components/shared/Layout';
import LoadingScreen from './components/shared/LoadingScreen';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    if (user.role === 'publisher') return <Navigate to="/publisher/dashboard" replace />;
    if (user.role === 'manufacturer') return <Navigate to="/manufacturer/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Marketplace - accessible to all logged in */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/marketplace" replace />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="marketplace/:id" element={<ListingDetailPage />} />
        <Route path="cart" element={<ProtectedRoute roles={['manufacturer']}><CartPage /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute roles={['manufacturer']}><CheckoutPage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:userId" element={<ProfilePage />} />

        {/* Publisher */}
        <Route path="publisher/dashboard" element={<ProtectedRoute roles={['publisher']}><PublisherDashboard /></ProtectedRoute>} />
        <Route path="publisher/listings" element={<ProtectedRoute roles={['publisher']}><PublisherListings /></ProtectedRoute>} />
        <Route path="publisher/listings/add" element={<ProtectedRoute roles={['publisher']}><AddListing /></ProtectedRoute>} />
        <Route path="publisher/listings/edit/:id" element={<ProtectedRoute roles={['publisher']}><EditListing /></ProtectedRoute>} />
        <Route path="publisher/orders" element={<ProtectedRoute roles={['publisher']}><PublisherOrders /></ProtectedRoute>} />

        {/* Manufacturer */}
        <Route path="manufacturer/dashboard" element={<ProtectedRoute roles={['manufacturer']}><ManufacturerDashboard /></ProtectedRoute>} />
        <Route path="manufacturer/orders" element={<ProtectedRoute roles={['manufacturer']}><ManufacturerOrders /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/listings" element={<ProtectedRoute roles={['admin']}><AdminListings /></ProtectedRoute>} />
        <Route path="admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/marketplace" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
                success: { iconTheme: { primary: '#2D6A4F', secondary: '#D8F3DC' } },
              }}
            />
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
