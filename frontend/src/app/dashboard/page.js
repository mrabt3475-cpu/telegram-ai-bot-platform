'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

function DashboardInner() {
  const [bots, setBots] = useState([]);
  const [stats, setStats] = useState({ totalBots: 0, totalMessages: 0, credits: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', telegramToken: '' });
  const [error, setError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [botsRes, statsRes] = await Promise.all([
        api.get('/api/bots'),
        api.get('/api/analytics/overview').catch(() => ({})),
      ]);
      setBots(botsRes.bots || botsRes || []);
      setStats({
        totalBots: (botsRes.bots || botsRes || []).length,
        totalMessages: statsRes.totalMessages || 0,
        credits: statsRes.credits || 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBot = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/bots', form);
      setForm({ name: '', description: '', telegramToken: '' });
      setShowForm(false);
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const deleteBot = async (id) => {
    if (!confirm('Delete this bot?')) return;
    try { await api.delete(`/api/bots/${id}`); loadAll(); } catch (err) { setError(err.message); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-4 py-2 rounded hover:opacity-90">
          {showForm ? 'Cancel' : '+ New Bot'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Bots" value={stats.totalBots} />
        <StatCard label="Total Messages" value={stats.totalMessages} />
        <StatCard label="Credits" value={stats.credits} />
      </div>

      {showForm && (
        <form onSubmit={createBot} className="bg-white p-6 rounded-lg shadow mb-8 space-y-4">
          <input required placeholder="Bot name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 border rounded" />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2 border rounded" />
          <input placeholder="Telegram Bot Token (from @BotFather)" value={form.telegramToken} onChange={(e) => setForm({ ...form, telegramToken: e.target.value })}
            className="w-full px-4 py-2 border rounded" />
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded">Create Bot</button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">Loading bots...</div>
      ) : bots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow text-gray-500">
          No bots yet. Create your first AI bot to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <div key={bot._id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">{bot.name}</h3>
              {bot.description && <p className="text-gray-600 text-sm mb-3">{bot.description}</p>}
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded text-xs ${bot.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {bot.status || 'inactive'}
                </span>
                <button onClick={() => deleteBot(bot._id)} className="text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}