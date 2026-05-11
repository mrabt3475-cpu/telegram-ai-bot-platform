'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, period]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [statsRes, alertsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/analytics/dashboard-stats', { headers }),
        axios.get('http://localhost:3000/api/analytics/alerts', { headers })
      ]);
      
      setStats(statsRes.data.stats);
      setAlerts(alertsRes.data.alerts || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">📊 Dashboard</h1>
            <div className="flex gap-3">
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="input w-auto"
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button onClick={fetchData} className="btn btn-secondary">
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'danger' ? 'bg-red-50 border-red-500' :
                alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {alert.type === 'danger' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Bots</p>
                <p className="text-3xl font-bold mt-1">{stats?.bots?.total || 0}</p>
                <p className="text-blue-100 text-sm">{stats?.bots?.active || 0} active</p>
              </div>
              <span className="text-4xl">🤖</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Points Balance</p>
                <p className="text-3xl font-bold mt-1">{stats?.balance?.points?.toLocaleString() || 0}</p>
                <p className="text-purple-100 text-sm">≈ ${((stats?.balance?.points || 0) / 100).toFixed(2)}</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">This Month</p>
                <p className="text-3xl font-bold mt-1">${stats?.costs?.monthly?.toFixed(4) || '0.00'}</p>
                <p className="text-green-100 text-sm">{stats?.costs?.byType?.reduce((s, c) => s + c.count, 0) || 0} requests</p>
              </div>
              <span className="text-4xl">📈</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Total Spent</p>
                <p className="text-3xl font-bold mt-1">${stats?.costs?.total?.toFixed(2) || '0.00'}</p>
                <p className="text-orange-100 text-sm">{stats?.invoices?.pending || 0} pending invoices</p>
              </div>
              <span className="text-4xl">💳</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Last 7 Days Chart */}
          <div className="card">
            <h3 className="font-semibold mb-4">📉 Costs Last 7 Days</h3>
            <div className="h-64 flex items-end gap-2">
              {(stats?.charts?.last7Days || []).map((day, idx) => {
                const maxAmount = Math.max(...(stats?.charts?.last7Days || []).map(d => d.amount), 1);
                const height = (day.amount / maxAmount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-purple-400 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`$${day.amount.toFixed(4)}`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Distribution */}
          <div className="card">
            <h3 className="font-semibold mb-4">🥧 Cost Distribution</h3>
            <div className="space-y-4">
              {(stats?.charts?.costDistribution || []).map((item, idx) => {
                const total = stats?.charts?.costDistribution?.reduce((s, i) => s + i.value, 0) || 1;
                const percent = ((item.value / total) * 100).toFixed(1);
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500'];
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{item._id}</span>
                      <span className="font-semibold">${item.value.toFixed(4)} ({percent}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[idx % colors.length]} transition-all`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {(stats?.charts?.costDistribution || []).length === 0 && (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Bots */}
        <div className="card">
          <h3 className="font-semibold mb-4">🏆 Top Bots by Usage</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Rank</th>
                  <th className="text-left p-3">Bot Name</th>
                  <th className="text-right p-3">Requests</th>
                  <th className="text-right p-3">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.charts?.topBots || []).map((bot, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{bot.botName}</td>
                    <td className="p-3 text-right">{bot.count}</td>
                    <td className="p-3 text-right font-semibold">${bot.total.toFixed(4)}</td>
                  </tr>
                ))}
                {(stats?.charts?.topBots || []).length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      No bots yet. <a href="/dashboard" className="text-primary hover:underline">Create your first bot</a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <a href="/bots/new" className="card hover:shadow-lg transition text-center p-6">
            <span className="text-4xl">➕</span>
            <p className="font-semibold mt-2">Create Bot</p>
          </a>
          <a href="/chat" className="card hover:shadow-lg transition text-center p-6">
            <span className="text-4xl">💬</span>
            <p className="font-semibold mt-2">AI Chat</p>
          </a>
          <a href="/billing" className="card hover:shadow-lg transition text-center p-6">
            <span className="text-4xl">💳</span>
            <p className="font-semibold mt-2">Add Points</p>
          </a>
          <a href="/analytics/report" className="card hover:shadow-lg transition text-center p-6">
            <span className="text-4xl">📊</span>
            <p className="font-semibold mt-2">Full Report</p>
          </a>
        </div>
      </main>
    </div>
  );
}