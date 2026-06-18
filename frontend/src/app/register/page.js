'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
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
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="name" type="text" placeholder="Full Name" required value={form.name} onChange={onChange}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary outline-none" />
          <input name="email" type="email" placeholder="Email" required value={form.email} onChange={onChange}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary outline-none" />
          <input name="password" type="password" placeholder="Password (min 6 chars)" required minLength={6} value={form.password} onChange={onChange}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary outline-none" />
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-2 rounded hover:opacity-90 disabled:opacity-50">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Have an account? <Link href="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}