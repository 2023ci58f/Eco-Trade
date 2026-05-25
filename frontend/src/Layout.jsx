import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { getInitials, timeAgo } from '../../utils/helpers';
import NotificationPanel from './NotificationPanel';

const publisherNav = [
  { to: '/publisher/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/publisher/listings', icon: '📋', label: 'My Listings' },
  { to: '/publisher/listings/add', icon: '➕', label: 'Add Listing' },
  { to: '/publisher/orders', icon: '📦', label: 'Orders' },
  { to: '/marketplace', icon: '🏪', label: 'Marketplace' },
  { to: '/chat', icon: '💬', label: 'Messages' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const manufacturerNav = [
  { to: '/manufacturer/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/marketplace', icon: '🏪', label: 'Marketplace' },
  { to: '/cart', icon: '🛒', label: 'Cart' },
  { to: '/manufacturer/orders', icon: '📦', label: 'My Orders' },
  { to: '/chat', icon: '💬', label: 'Messages' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

const adminNav = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/listings', icon: '📋', label: 'Listings' },
  { to: '/admin/orders', icon: '📦', label: 'Orders' },
  { to: '/marketplace', icon: '🏪', label: 'Marketplace' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart() || {};
  const { unreadCount } = useNotifications() || {};
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = user?.role === 'publisher' ? publisherNav
    : user?.role === 'manufacturer' ? manufacturerNav
    : adminNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-sm flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-[#2D6A4F] rounded-xl flex items-center justify-center text-white font-bold text-lg font-syne flex-shrink-0">E</div>
          {sidebarOpen && <span className="font-syne font-bold text-xl text-[#2D6A4F]">EcoTrade</span>}
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-3">
            <span className={`badge text-xs px-3 py-1 ${user?.role === 'publisher' ? 'bg-blue-100 text-blue-700' : user?.role === 'manufacturer' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`
              }
            >
              <span className="text-lg flex-shrink-0">{icon}</span>
              {sidebarOpen && <span className="truncate">{label}</span>}
              {sidebarOpen && label === 'Cart' && cartCount > 0 && (
                <span className="ml-auto bg-[#2D6A4F] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] font-semibold text-sm flex-shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors text-sm" title="Logout">⏻</button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-gray-400 hover:text-red-500 py-1" title="Logout">⏻</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4 shadow-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-[#2D6A4F] transition-colors text-xl">☰</button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-[#D8F3DC] rounded-full flex items-center justify-center text-[#2D6A4F] font-semibold text-sm">
                {getInitials(user?.name)}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
              <span className="text-gray-400 text-xs">▾</span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-hover border border-gray-100 py-2 z-50 animate-fadeIn">
                <button onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">👤 Profile</button>
                <hr className="my-1 border-gray-100" />
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">⏻ Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
