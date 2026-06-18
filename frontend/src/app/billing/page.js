'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

function BillingInner() {
  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [invRes, planRes] = await Promise.all([
        api.get('/api/payment/invoices').catch(() => ({ invoices: [] })),
        api.get('/api/payment/plans').catch(() => ({ plans: [] })),
      ]);
      setInvoices(invRes.invoices || []);
      setPlans(planRes.plans || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const subscribe = async (planId) => {
    try {
      const res = await api.post('/api/payment/subscribe', { planId });
      if (res.checkoutUrl) window.location.href = res.checkoutUrl;
      else if (paymentUrl) window.location.href = paymentUrl;
      else alert('Subscribed successfully');
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Plans</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {plans.length === 0 ? (
          <p className="text-gray-500">No plans available.</p>
        ) : plans.map((p) => (
          <div key={p._id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold">{p.name}</h3>
            <p className="text-3xl font-bold mt-2">${p.price}<span className="text-sm text-gray-500">/mo</span></p>
            <p className="text-gray-600 text-sm mt-2">{p.credits} credits/month</p>
            <button onClick={() => subscribe(p._id)} className="mt-4 w-full bg-primary text-white py-2 rounded">
              Subscribe
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Invoices</h2>
      {loading ? <p>Loading...</p> : invoices.length === 0 ? (
        <p className="text-gray-500">No invoices yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-t">
                  <td className="px-4 py-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">${inv.amount}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingInner />
    </ProtectedRoute>
  );
}