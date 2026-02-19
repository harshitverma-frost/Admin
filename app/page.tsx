'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Wine } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Welcome to admin panel!');
      router.push('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Radial vignette background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/30 via-transparent to-plum/20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gold/3 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-2xl shadow-primary/30 border border-gold/15">
            <Wine className="h-8 w-8 text-gold" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-gold-soft tracking-wide">Admin Panel</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-gradient-to-br from-card-bg to-card-bg-elevated p-6 shadow-2xl shadow-black/30">
          {/* Ornamental line */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/25 to-transparent mb-6" />

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/15 transition-all duration-300"
              placeholder="admin@kspwines.com"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/15 transition-all duration-300"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-[#E8D8B9] hover:bg-primary-light border border-gold/10 transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:shadow-primary/20"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Bottom ornamental line */}
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-gold/15 to-transparent mt-6" />
        </form>
      </div>
    </div>
  );
}
