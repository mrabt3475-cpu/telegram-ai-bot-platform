'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

const INTEGRATIONS = [
  { id: 'github', name: 'GitHub', desc: 'Connect your repositories', icon: '🐙' },
  { id: 'discord', name: 'Discord', desc: 'Bridge bots to Discord', icon: '🎮' },
  { id: 'googlesheets', name: 'Google Sheets', desc: 'Read/write spreadsheet data', icon: '📊' },
  { id: 'notion', name: 'Notion', desc: 'Sync with Notion databases', icon: '📝' },
];

function IntegrationsInner() {
  const [connected, setConnected] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/integrations').then((r) => setConnected(r.integrations || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggle = async (id) => {
    try {
      if (connected.includes(id)) {
        await api.post(`/api/integrations/${id}/disconnect`);
        setConnected(connected.filter((c) => c !== id));
      } else {
        const res = await api.post(`/api/integrations/${id}/connect`);
        if (res.authUrl) window.location.href = res.authUrl;
      }
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Integrations</h1>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTEGRATIONS.map((it) => {
            const isOn = connected.includes(it.id);
            return (
              <div key={it.id} className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{it.icon}</span>
                  <div>
                    <h3 className="font-semibold">{it.name}</h3>
                    <p className="text-sm text-gray-500">{it.desc}</p>
                  </div>
                </div>
                <button onClick={() => toggle(it.id)}
                  className={`px-4 py-2 rounded text-sm ${isOn ? 'bg-red-100 text-red-700' : 'bg-primary text-white'}`}>
                  {isOn ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <ProtectedRoute>
      <IntegrationsInner />
    </ProtectedRoute>
  );
}