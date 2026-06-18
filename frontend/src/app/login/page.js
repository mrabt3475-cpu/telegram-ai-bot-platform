'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary outline-none" />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary outline-none" />
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-2 rounded hover:opacity-90 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          No account? <Link href="/register" className="text-primary font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
}