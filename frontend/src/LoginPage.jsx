import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const result = await login(data.email, data.password);
      toast.success(`Welcome back, ${result.user.name}!`);
      const redirectMap = { publisher: '/publisher/dashboard', manufacturer: '/manufacturer/dashboard', admin: '/admin/dashboard' };
      navigate(redirectMap[result.user.role] || '/marketplace');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role) => {
    const creds = {
      publisher: { email: 'publisher1@ecotrade.com', password: 'password123' },
      manufacturer: { email: 'manufacturer1@ecotrade.com', password: 'password123' },
      admin: { email: 'admin@ecotrade.com', password: 'admin123' },
    };
    try {
      setLoading(true);
      const result = await login(creds[role].email, creds[role].password);
      toast.success(`Logged in as ${role}`);
      const redirectMap = { publisher: '/publisher/dashboard', manufacturer: '/manufacturer/dashboard', admin: '/admin/dashboard' };
      navigate(redirectMap[result.user.role] || '/marketplace');
    } catch {
      toast.error('Demo login failed. Please seed the database first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#2D6A4F] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#2D6A4F] font-bold text-2xl font-syne">E</div>
            <span className="text-white font-syne font-bold text-2xl">EcoTrade</span>
          </div>
          <h1 className="text-4xl font-syne font-bold text-white leading-tight mb-6">
            The Smarter Way to Trade Waste
          </h1>
          <p className="text-[#D8F3DC] text-lg leading-relaxed">
            Connect publishers with waste materials to manufacturers who turn them into valuable products. Building a circular economy, one transaction at a time.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[['♻️', '10K+', 'Tons Recycled'], ['🏭', '500+', 'Manufacturers'], ['📦', '2K+', 'Listings']].map(([icon, num, label]) => (
            <div key={label} className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-white font-syne font-bold text-xl">{num}</div>
              <div className="text-[#D8F3DC] text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center text-white font-bold text-xl font-syne">E</div>
            <span className="font-syne font-bold text-xl text-[#2D6A4F]">EcoTrade</span>
          </div>

          <h2 className="text-2xl font-syne font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                type="email"
                placeholder="you@example.com"
                className="input"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                placeholder="••••••••"
                className="input"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-center text-xs text-gray-400 mb-3">Quick demo login</p>
            <div className="grid grid-cols-3 gap-2">
              {['publisher', 'manufacturer', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => demoLogin(role)}
                  disabled={loading}
                  className="border border-gray-200 rounded-xl py-2 text-xs text-gray-600 hover:bg-[#D8F3DC] hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-all capitalize"
                >
                  {role === 'publisher' ? '📤' : role === 'manufacturer' ? '🏭' : '🔑'} {role}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2D6A4F] font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
