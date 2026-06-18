'use client';
import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

function ProfileInner() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/api/auth/profile', form);
      setMsg('Profile updated!');
    } catch (err) { setMsg(`Error: ${err.message}`); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        {msg && <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded text-sm">{msg}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={form.email} disabled className="w-full px-4 py-2 border rounded bg-gray-50" />
          </div>
          <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2 rounded disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
      <button onClick={logout} className="text-red-500 hover:text-red-700 text-sm">Log out</button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileInner />
    </ProtectedRoute>
  );
}