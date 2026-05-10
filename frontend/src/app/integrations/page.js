'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Integrations() {
  const router = useRouter();
  const [telegram, setTelegram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [botToken, setBotToken] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchIntegrations();
  }, [router]);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/integrations/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelegram(res.data.integrations?.telegram);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const setupTelegramBot = async (e) => {
    e.preventDefault();
    if (!botToken.trim()) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:3000/api/integrations/telegram/setup',
        { botToken },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTelegram(res.data.bot);
      setBotToken('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to setup bot');
    }
    setSaving(false);
  };

  const disconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect the bot?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:3000/api/integrations/telegram', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTelegram(null);
    } catch (err) {
      alert('Failed to disconnect');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">📱 Telegram Integration</h1>
          <nav className="flex gap-3 text-sm">
            <a href="/dashboard" className="text-gray-600 hover:text-primary">Dashboard</a>
            <a href="/chat" className="text-gray-600 hover:text-primary">AI Chat</a>
            <a href="/profile" className="text-gray-600 hover:text-primary">Profile</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl">✈️</span>
            <div>
              <h2 className="text-xl font-semibold">Telegram Bot</h2>
              <p className="text-gray-500">Connect your Telegram bot to send messages</p>
            </div>
          </div>

          {telegram ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                  <div>
                    <p className="font-semibold text-green-800">{telegram.botName}</p>
                    <p className="text-sm text-green-600">@{telegram.botUsername}</p>
                  </div>
                </div>
                <button
                  onClick={disconnectTelegram}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={setupTelegramBot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get token from @BotFather on Telegram
                </p>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !botToken.trim()}
              >
                {saving ? 'Connecting...' : 'Connect Bot'}
              </button>
            </form>
          )}
        </div>

        {/* Webhooks */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">🔗 Webhooks</h3>
          <p className="text-gray-600 mb-4">Configure webhooks for real-time notifications</p>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://your-server.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
              <div className="flex gap-4 flex-wrap">
                {['bot.message', 'bot.start', 'payment.received'].map(event => (
                  <label key={event} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-primary" defaultChecked />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Save Webhook
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}