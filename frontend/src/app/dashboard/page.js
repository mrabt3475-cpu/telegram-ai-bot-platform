'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, [router]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [dashboardRes, alertsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/analytics/dashboard', { headers }),
        axios.get('http://localhost:3000/api/analytics/alerts', { headers })
      ]);
      
      setData(dashboardRes.data.data);
      setAlerts(alertsRes.data.data.alerts || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
              <p className="text-gray-500 text-sm">مرحباً، {data?.user?.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">الخطة</p>
                <p className="font-bold text-primary capitalize">{data?.user?.subscription || 'Free'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">النقاط</p>
                <p className="font-bold text-yellow-600">{data?.user?.points || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`p-4 rounded-lg flex items-center gap-3 ${
                alert.type === 'danger' ? 'bg-red-50 border border-red-200 text-red-700' :
                alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                <span className="text-xl">
                  {alert.type === 'danger' ? '🔴' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* البوتات */}
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">البوتات</p>
                <p className="text-3xl font-bold mt-1">{data?.bots?.total || 0}</p>
                <p className="text-blue-100 text-xs mt-1">{data?.bots?.active} نشط</p>
              </div>
              <span className="text-4xl">🤖</span>
            </div>
          </div>

          {/* الرسائل */}
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">الرسائل</p>
                <p className="text-3xl font-bold mt-1">{data?.costs?.total?.totalMessages || 0}</p>
                <p className="text-purple-100 text-xs mt-1">إجمالي</p>
              </div>
              <span className="text-4xl">💬</span>
            </div>
          </div>

          {/* الإنفاق */}
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">الإنفاق</p>
                <p className="text-3xl font-bold mt-1">${(data?.costs?.total?.totalSpent || 0).toFixed(2)}</p>
                <p className="text-green-100 text-xs mt-1">كل الوقت</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
          </div>

          {/* الفواتير */}
          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">الفواتير</p>
                <p className="text-3xl font-bold mt-1">{data?.invoices?.pending || 0}</p>
                <p className="text-orange-100 text-xs mt-1">معلقة</p>
              </div>
              <span className="text-4xl">📄</span>
            </div>
          </div>
        </div>

        {/* Monthly Usage */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="font-bold text-lg mb-4">📊 استخدام هذا الشهر</h3>
            <div className="space-y-3">
              {(data?.costs?.thisMonth || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {item._id === 'message' ? '💬' : item._id === 'image' ? '🖼️' : '🔗'}
                    </span>
                    <span className="font-medium capitalize">{item._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.total || 0).toFixed(4)}</p>
                    <p className="text-xs text-gray-500">{item.count} طلب</p>
                  </div>
                </div>
              ))}
              {(data?.costs?.thisMonth || []).length === 0 && (
                <p className="text-gray-500 text-center py-4">لا يوجد استخدام هذا الشهر</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4">⚡ إجراءات سريعة</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/bots/new" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition">
                <span className="text-2xl block mb-1">➕</span>
                <span className="text-blue-700 font-medium">بوت جديد</span>
              </a>
              <a href="/billing" className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition">
                <span className="text-2xl block mb-1">💎</span>
                <span className="text-yellow-700 font-medium">إضافة رصيد</span>
              </a>
              <a href="/chat" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition">
                <span className="text-2xl block mb-1">🤖</span>
                <span className="text-purple-700 font-medium">محادثة AI</span>
              </a>
              <a href="/integrations" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition">
                <span className="text-2xl block mb-1">🔗</span>
                <span className="text-green-700 font-medium">التكاملات</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bots List */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">🤖 البوتات</h3>
            <a href="/bots" className="text-primary hover:underline text-sm">عرض الكل →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right p-3">البوت</th>
                  <th className="text-right p-3">الحالة</th>
                  <th className="text-right p-3">الرسائل</th>
                  <th className="text-right p-3">المستخدمين</th>
                  <th className="text-right p-3">الإيرادات</th>
                </tr>
              </thead>
              <tbody>
                {(data?.bots?.list || []).map((bot, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3">
                      <p className="font-medium">{bot.name}</p>
                      <p className="text-xs text-gray-500">@{bot.id?.substring(0, 8)}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${bot.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {bot.isActive ? 'نشط' : 'متوقف'}
                      </span>
                    </td>
                    <td className="p-3">{bot.messages}</td>
                    <td className="p-3">{bot.users}</td>
                    <td className="p-3">${bot.revenue?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
                {(data?.bots?.list || []).length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      <p className="text-4xl mb-2">🤖</p>
                      <p>لا توجد بوتات بعد</p>
                      <a href="/bots/new" className="text-primary hover:underline">أنشئ بوتك الأول →</a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Costs */}
        <div className="card mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">📋 التكاليف الأخيرة</h3>
            <a href="/billing" className="text-primary hover:underline text-sm">عرض الكل →</a>
          </div>
          <div className="space-y-2">
            {(data?.costs?.recent || []).map((cost, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {cost.type === 'message' ? '💬' : cost.type === 'image' ? '🖼️' : '💳'}
                  </span>
                  <div>
                    <p className="font-medium capitalize">{cost.type}</p>
                    <p className="text-xs text-gray-500">{new Date(cost.createdAt).toLocaleDateString('ar')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${(cost.amount || 0).toFixed(4)}</p>
                  <p className="text-xs text-gray-500">{cost.points} نقطة</p>
                </div>
              </div>
            ))}
            {(data?.costs?.recent || []).length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد تكاليف</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}