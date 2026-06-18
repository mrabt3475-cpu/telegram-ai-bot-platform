'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

function AnalyticsInner() {
  const [data, setData] = useState({ totalMessages: 0, totalBots: 0, creditsUsed: 0, recentActivity: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/analytics/overview').then((d) => setData(d || data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>
      {loading ? <p>Loading...</p> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Stat label="Total Messages" value={data.totalMessages || 0} />
            <Stat label="Active Bots" value={data.totalBots || 0} />
            <Stat label="Credits Used" value={data.creditsUsed || 0} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            {(data.recentActivity || []).length === 0 ? (
              <p className="text-gray-500">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentActivity.map((a, i) => (
                  <li key={i} className="text-sm border-b pb-2">
                    <span className="text-gray-500">{new Date(a.timestamp || a.createdAt).toLocaleString()}</span>
                    <span className="ml-2">{a.event || a.action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsInner />
    </ProtectedRoute>
  );
}