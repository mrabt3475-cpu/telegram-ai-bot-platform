'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem('token');
      router.push('/login');
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Profile</h1>
          <nav className="flex gap-4">
            <a href="/dashboard" className="text-gray-600 hover:text-primary">Dashboard</a>
            <a href="/chat" className="text-gray-600 hover:text-primary">AI Chat</a>
            <a href="/integrations" className="text-gray-600 hover:text-primary">Integrations</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="card">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold">{user?.username}</h2>
                <p className="text-gray-500">{user?.email}</p>
                <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm mt-2">
                  {user?.subscription}
                </span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Points</span>
                  <span className="font-semibold">{user?.points || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Referrals</span>
                  <span className="font-semibold">{user?.referrals?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-semibold">{new Date(user?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <div className="md:col-span-2">
            <div className="card">
              <div className="flex border-b mb-4">
                <button
                  className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Edit Profile
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'api' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('api')}
                >
                  API Keys
                </button>
              </div>

              {activeTab === 'profile' && (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input type="text" className="input" defaultValue={user?.username} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="input" defaultValue={user?.email} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Chat ID</label>
                    <input type="text" className="input" defaultValue={user?.telegramChatId || ''} placeholder="Your Telegram Chat ID" />
                  </div>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </form>
              )}

              {activeTab === 'security' && (
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input type="password" className="input" placeholder="Current password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" className="input" placeholder="New password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" className="input" placeholder="Confirm password" />
                  </div>
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </form>
              )}

              {activeTab === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <div className="flex gap-2">
                      <input type="text" className="input" value={user?.apiKey || 'Not generated'} readOnly />
                      <button className="btn btn-secondary">Regenerate</button>
                    </div>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">API Usage</h4>
                    <p className="text-sm text-gray-600">Requests this month: {user?.apiRequestsThisMonth || 0} / {user?.apiLimit || 1000}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}