import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (!selectedRole) { toast.error('Please select a role'); return; }
    try {
      setLoading(true);
      const result = await registerUser({ ...data, role: selectedRole });
      toast.success(`Account created! Welcome, ${result.user.name}!`);
      const redirectMap = { publisher: '/publisher/dashboard', manufacturer: '/manufacturer/dashboard' };
      navigate(redirectMap[selectedRole] || '/marketplace');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center text-white font-bold text-xl font-syne">E</div>
          <span className="font-syne font-bold text-xl text-[#2D6A4F]">EcoTrade</span>
        </div>

        <div className="card">
          <h2 className="text-2xl font-syne font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-500 text-sm mb-6">Join the smart waste marketplace</p>

          {/* Role selector */}
          <div className="mb-6">
            <label className="label">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'publisher', icon: '📤', title: 'Publisher', desc: 'I have waste materials to sell' },
                { role: 'manufacturer', icon: '🏭', title: 'Manufacturer', desc: 'I buy waste for recycling' },
              ].map(({ role, icon, title, desc }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRole === role ? 'border-[#2D6A4F] bg-[#D8F3DC]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })} placeholder="John Doe" className="input" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Company (optional)</label>
                <input {...register('company')} placeholder="Your company" className="input" />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                type="email" placeholder="you@company.com" className="input"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Phone (optional)</label>
              <input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="input" />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                type="password" placeholder="Min 6 characters" className="input"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading || !selectedRole} className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2D6A4F] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
