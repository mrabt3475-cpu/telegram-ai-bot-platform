'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="input" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Don't have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}