'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Billing() {
  const router = useRouter();
  const [balance, setBalance] = useState(null);
  const [costs, setCosts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [balanceRes, costsRes, invoicesRes, plansRes] = await Promise.all([
        axios.get('http://localhost:3000/api/costs/balance', { headers }),
        axios.get('http://localhost:3000/api/costs/costs?limit=10', { headers }),
        axios.get('http://localhost:3000/api/costs/invoices?limit=5', { headers }),
        axios.get('http://localhost:3000/api/costs/plans', { headers })
      ]);
      
      setBalance(balanceRes.data.balance);
      setCosts(costsRes.data.costs);
      setInvoices(invoicesRes.data.invoices);
      setPlans(plansRes.data.plans);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const addPoints = async (amount) => {
    try {
      const token = localStorage.getItem('token');
      // هنا يتم التوجيه لصفحة الدفع
      alert(`Redirecting to payment for ${amount} points...`);
    } catch (err) {
      alert('Payment failed');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">💳 Billing & Costs</h1>
          <nav className="flex gap-3 text-sm">
            <a href="/dashboard" className="text-gray-600 hover:text-primary">Dashboard</a>
            <a href="/chat" className="text-gray-600 hover:text-primary">Chat</a>
            <a href="/integrations" className="text-gray-600 hover:text-primary">Telegram</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Balance Card */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card bg-gradient-to-br from-primary to-blue-600 text-white">
            <p className="text-blue-100 text-sm">Available Points</p>
            <p className="text-4xl font-bold mt-2">{balance?.points || 0}</p>
            <p className="text-blue-100 text-sm mt-2">≈ ${(balance?.points || 0) / 100}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Total Spent</p>
            <p className="text-3xl font-bold mt-2">${balance?.totalSpent?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Current Plan</p>
            <p className="text-2xl font-bold mt-2 capitalize">{balance?.subscription || 'Free'}</p>
            <a href="/pricing" className="text-primary text-sm mt-2 block hover:underline">Upgrade →</a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {['overview', 'costs', 'invoices', 'plans'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 capitalize ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Monthly Costs */}
            <div className="card">
              <h3 className="font-semibold mb-4">This Month Usage</h3>
              <div className="space-y-3">
                {(balance?.monthlyCosts || []).map(item => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize">{item._id}</span>
                    <div className="text-right">
                      <p className="font-semibold">${(item.total || 0).toFixed(4)}</p>
                      <p className="text-xs text-gray-500">{item.count} requests</p>
                    </div>
                  </div>
                ))}
                {(balance?.monthlyCosts || []).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No usage this month</p>
                )}
              </div>
            </div>

            {/* Add Points */}
            <div className="card">
              <h3 className="font-semibold mb-4">Add Points</h3>
              <div className="grid grid-cols-4 gap-3">
                {[100, 500, 1000, 5000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => addPoints(amount)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition text-center"
                  >
                    <p className="font-bold text-lg">{amount}</p>
                    <p className="text-sm text-gray-500">${amount / 100}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div className="card">
            <h3 className="font-semibold mb-4">Recent Costs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Description</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-right p-3">Status</th>
                    <th className="text-right p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.map(cost => (
                    <tr key={cost._id} className="border-t">
                      <td className="p-3 capitalize">{cost.type}</td>
                      <td className="p-3 text-gray-500">{cost.description || '-'}</td>
                      <td className="p-3 text-right">${cost.amount?.toFixed(4) || '0'}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${cost.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                          {cost.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-gray-500">
                        {new Date(cost.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="card">
            <h3 className="font-semibold mb-4">Invoices</h3>
            <div className="space-y-3">
              {invoices.map(invoice => (
                <div key={invoice._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">{invoice.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${invoice.total?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${invoice.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="text-gray-500 text-center py-4">No invoices</p>
              )}
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="grid md:grid-cols-4 gap-4">
            {plans.map(plan => (
              <div key={plan._id} className={`card ${plan.isPopular ? 'border-2 border-primary' : ''}`}>
                {plan.isPopular && (
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">Popular</span>
                )}
                <h3 className="font-bold text-lg mt-2">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">
                  ${plan.price}
                  <span className="text-sm text-gray-500 font-normal">/{plan.period}</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className="btn btn-primary w-full mt-4">
                  {balance?.subscription === plan.name ? 'Current' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}