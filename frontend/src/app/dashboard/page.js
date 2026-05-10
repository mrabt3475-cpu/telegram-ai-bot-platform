'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData(token);
  }, [router]);

  const fetchData = async (token) => {
    try {
      const userRes = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const botsRes = await axios.get('http://localhost:3000/api/bots', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data.user);
      setBots(botsRes.data.bots);
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.username}</span>
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">{user?.subscription}</span>
            <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-gray-500 text-sm">Total Bots</h3>
            <p className="text-3xl font-bold">{bots.length}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-500 text-sm">Points</h3>
            <p className="text-3xl font-bold">{user?.points || 0}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-500 text-sm">Referrals</h3>
            <p className="text-3xl font-bold">{user?.referrals?.length || 0}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Bots</h2>
          <button className="btn btn-primary">Create Bot</button>
        </div>

        {bots.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">You haven't created any bots yet.</p>
            <button className="btn btn-primary">Create Your First Bot</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot) => (
              <div key={bot._id} className="card">
                <h3 className="font-semibold text-lg mb-2">{bot.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{bot.description || 'No description'}</p>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${bot.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                    {bot.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-600">{bot.aiProvider}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}