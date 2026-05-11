'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Billing() {
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [costs, setCosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
      
      const [balanceRes, costsRes, invoicesRes, plansRes, analyticsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/costs/balance', { headers }),
        axios.get('http://localhost:3000/api/costs/costs?limit=20', { headers }),
        axios.get('http://localhost:3000/api/costs/invoices?limit=10', { headers }),
        axios.get('http://localhost:3000/api/costs/plans', { headers }),
        axios.get(`http://localhost:3000/api/analytics/costs/analytics?period=${period}`, { headers })
      ]);
      
      setBalance(balanceRes.data.balance);
      setCosts(costsRes.data.costs);
      setInvoices(invoicesRes.data.invoices);
      setPlans(plansRes.data.plans);
      setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addPoints = async (amount) => {
    alert(`سيتم توجيهك لصفحة الدفع لإضافة ${amount} نقطة`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">💳 إدارة التكاليف</h1>
            <p className="text-gray-500 text-sm">تتبع إنفاقك وإدارة رصيدك</p>
          </div>
          <nav className="flex gap-3 text-sm">
            <a href="/dashboard" className="text-gray-600 hover:text-primary">لوحة التحكم</a>
            <a href="/chat" className="text-gray-600 hover:text-primary">محادثة AI</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Balance Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
            <p className="text-yellow-100 text-sm">النقاط المتاحة</p>
            <p className="text-4xl font-bold mt-2">{balance?.points || 0}</p>
            <p className="text-yellow-100 text-sm mt-2">≈ ${((balance?.points || 0) / 100).toFixed(2)}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">إجمالي الإنفاق</p>
            <p className="text-3xl font-bold mt-2 text-gray-800">${balance?.totalSpent?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">هذا الشهر</p>
            <p className="text-3xl font-bold mt-2 text-gray-800">
              ${(analytics?.summary?.currentPeriod || 0).toFixed(2)}
            </p>
            <p className={`text-sm mt-2 ${parseFloat(analytics?.summary?.change || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {parseFloat(analytics?.summary?.change || 0) > 0 ? '↑' : '↓'} {Math.abs(analytics?.summary?.change || 0)}%
            </p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">الخطة الحالية</p>
            <p className="text-2xl font-bold mt-2 capitalize text-primary">{balance?.subscription || 'Free'}</p>
            <a href="/pricing" className="text-primary text-sm mt-2 block hover:underline">ترقية →</a>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-6">
          {['day', 'week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm ${period === p ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              {p === 'day' ? 'اليوم' : p === 'week' ? 'أسبوع' : p === 'month' ? 'شهر' : 'سنة'}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: '📊' },
            { id: 'costs', label: 'التكاليف', icon: '💰' },
            { id: 'analytics', label: 'التحليلات', icon: '📈' },
            { id: 'invoices', label: 'الفواتير', icon: '📄' },
            { id: 'plans', label: 'الخطط', icon: '💎' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Usage */}
            <div className="card">
              <h3 className="font-bold text-lg mb-4">📊 استخدام هذا الشهر</h3>
              <div className="space-y-3">
                {(balance?.monthlyCosts || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {item._id === 'message' ? '💬' : item._id === 'image' ? '🖼️' : '🔗'}
                      </span>
                      <span className="font-medium capitalize">{item._id}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${(item.total || 0).toFixed(4)}</p>
                      <p className="text-sm text-gray-500">{item.count} طلب</p>
                    </div>
                  </div>
                ))}
                {(balance?.monthlyCosts || []).length === 0 && (
                  <p className="text-gray-500 text-center py-8">لا يوجد استخدام هذا الشهر</p>
                )}
              </div>
            </div>

            {/* Add Points */}
            <div className="card">
              <h3 className="font-bold text-lg mb-4">💎 إضافة نقاط</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { points: 100, price: 1 },
                  { points: 500, price: 5 },
                  { points: 1000, price: 10 },
                  { points: 5000, price: 50 },
                  { points: 10000, price: 100 },
                  { points: 50000, price: 500 }
                ].map(item => (
                  <button
                    key={item.points}
                    onClick={() => addPoints(item.points)}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition text-center group"
                  >
                    <p className="font-bold text-lg group-hover:text-primary">{item.points}</p>
                    <p className="text-gray-500 text-sm">${item.price}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div className="card">
            <h3 className="font-bold text-lg mb-4">💰 سجل التكاليف</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-right p-3">النوع</th>
                    <th className="text-right p-3">الوصف</th>
                    <th className="text-right p-3">النقاط</th>
                    <th className="text-right p-3">المبلغ</th>
                    <th className="text-right p-3">الحالة</th>
                    <th className="text-right p-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map(cost => (
                    <tr key={cost._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">
                            {cost.type === 'message' ? '💬' : cost.type === 'image' ? '🖼️' : '💳'}
                          </span>
                          <span className="capitalize">{cost.type}</span>
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">{cost.description || '-'}</td>
                      <td className="p-3 font-medium">{cost.points || 0}</td>
                      <td className="p-3 font-medium">${(cost.amount || 0).toFixed(4)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cost.status === 'paid' ? 'bg-green-100 text-green-600' : 
                          cost.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {cost.status === 'paid' ? 'مدفوع' : cost.status === 'pending' ? 'معلق' : 'فشل'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Date(cost.createdAt).toLocaleDateString('ar')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {costs.length === 0 && (
                <p className="text-gray-500 text-center py-8">لا توجد تكاليف</p>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-gray-500 text-sm">الفترة الحالية</p>
                <p className="text-3xl font-bold text-primary mt-2">${analytics.summary.currentPeriod.toFixed(2)}</p>
              </div>
              <div className="card text-center">
                <p className="text-gray-500 text-sm">الفترة السابقة</p>
                <p className="text-3xl font-bold mt-2">${analytics.summary.previousPeriod.toFixed(2)}</p>
              </div>
              <div className="card text-center">
                <p className="text-gray-500 text-sm">التغيير</p>
                <p className={`text-3xl font-bold mt-2 ${parseFloat(analytics.summary.change) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {parseFloat(analytics.summary.change) > 0 ? '↑' : '↓'} {Math.abs(analytics.summary.change)}%
                </p>
              </div>
            </div>

            {/* By Type */}
            <div className="card">
              <h3 className="font-bold text-lg mb-4">📊 حسب النوع</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {(analytics.byType || []).map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl text-center">
                    <p className="text-2xl mb-2">
                      {item._id === 'message' ? '💬' : item._id === 'image' ? '🖼️' : '🔗'}
                    </p>
                    <p className="font-bold text-lg capitalize">{item._id}</p>
                    <p className="text-2xl font-bold text-primary">${item.total.toFixed(4)}</p>
                    <p className="text-sm text-gray-500">{item.count} طلب</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Chart (Text) */}
            <div className="card">
              <h3 className="font-bold text-lg mb-4">📈 التكاليف اليومية</h3>
              <div className="space-y-2">
                {(analytics.daily || []).slice(-7).map((day, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-24">{day._id}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-purple-500"
                        style={{ width: `${Math.min((day.total / (analytics.summary.currentPeriod || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-20 text-right">${day.total.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="card">
            <h3 className="font-bold text-lg mb-4">📄 الفواتير</h3>
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div key={invoice._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{invoice.type} • {new Date(invoice.createdAt).toLocaleDateString('ar')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${invoice.total?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-600' :
                      invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'pending' ? 'معلقة' : 'فاشلة'}
                    </span>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="text-gray-500 text-center py-8">لا توجد فواتير</p>
              )}
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid md:grid-cols-5 gap-4">
            {plans.map(plan => (
              <div key={plan._id} className={`card ${plan.isPopular ? 'border-2 border-primary' : ''} ${plan.isVip ? 'border-2 border-yellow-400 bg-yellow-50' : ''}`}>
                {plan.isPopular && (
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">Popular</span>
                )}
                {plan.isVip && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">👑 VIP</span>
                )}
                <h3 className="font-bold text-lg mt-2">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">
                  ${plan.price}
                  <span className="text-sm text-gray-500 font-normal">/{plan.period}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features?.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={`btn w-full mt-4 ${plan.isVip ? 'btn-warning' : 'btn-primary'}`}>
                  {balance?.subscription === plan.name ? 'الحالية' : 'اختيار'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}