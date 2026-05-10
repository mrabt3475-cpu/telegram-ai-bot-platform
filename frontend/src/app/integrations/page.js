'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Integrations() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState({
    github: false,
    discord: false,
    slack: false,
    google: false,
    telegram: false,
    whatsapp: false
  });
  const [loading, setLoading] = useState(true);

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
      setIntegrations(res.data.integrations);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const connectIntegration = async (service) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:3000/api/integrations/${service}/auth`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = res.data.url;
    } catch (err) {
      alert('Failed to initiate connection');
    }
  };

  const disconnectIntegration = async (service) => {
    if (!confirm(`Are you sure you want to disconnect ${service}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/integrations/${service}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrations({ ...integrations, [service]: false });
    } catch (err) {
      alert('Failed to disconnect');
    }
  };

  const integrationList = [
    { id: 'github', name: 'GitHub', icon: '🐙', description: 'Connect repositories and manage issues', color: '#333' },
    { id: 'discord', name: 'Discord', icon: '💬', description: 'Send notifications to Discord channels', color: '#5865F2' },
    { id: 'slack', name: 'Slack', icon: '📱', description: 'Post messages to Slack workspaces', color: '#4A154B' },
    { id: 'google', name: 'Google', icon: '🔍', description: 'Access Google Drive and Calendar', color: '#4285F4' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', description: 'Send messages via Telegram bots', color: '#0088cc' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💙', description: 'Connect WhatsApp Business API', color: '#25D366' }
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Integrations</h1>
          <nav className="flex gap-4">
            <a href="/dashboard" className="text-gray-600 hover:text-primary">Dashboard</a>
            <a href="/chat" className="text-gray-600 hover:text-primary">AI Chat</a>
            <a href="/profile" className="text-gray-600 hover:text-primary">Profile</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Connect Your Apps</h2>
          <p className="text-gray-600">Integrate with your favorite tools to enhance your AI bots</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationList.map(item => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              </div>
              {integrations[item.id] ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Connected
                  </span>
                  <button
                    onClick={() => disconnectIntegration(item.id)}
                    className="text-red-500 text-sm hover:underline ml-auto"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connectIntegration(item.id)}
                  className="btn btn-primary w-full"
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 card">
          <h3 className="text-lg font-semibold mb-4">Webhooks</h3>
          <p className="text-gray-600 mb-4">Configure webhooks to receive real-time events</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
              <input type="text" className="input" placeholder="https://your-server.com/webhook" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Events</label>
              <div className="flex gap-2 flex-wrap">
                {['bot.created', 'bot.updated', 'payment.received', 'user.registered'].map(event => (
                  <label key={event} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary">Save Webhook</button>
          </div>
        </div>
      </main>
    </div>
  );
}