'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/payment/plans').then((r) => setPlans(r.plans || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">Simple, transparent pricing</h1>
      <p className="text-center text-gray-600 mb-12">Choose the plan that fits your needs.</p>

      {loading ? <p className="text-center">Loading plans...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.length === 0 ? (
            <>
              <PlanCard name="Starter" price={0} credits={100} features={['1 Bot', '100 credits/mo', 'Community support']} />
              <PlanCard name="Pro" price={29} credits={5000} features={['5 Bots', '5,000 credits/mo', 'Priority support', 'Analytics']} highlight />
              <PlanCard name="Enterprise" price={99} credits={25000} features={['Unlimited bots', '25,000 credits/mo', 'Dedicated support', 'Custom integrations']} />
            </>
          ) : plans.map((p) => (
            <PlanCard key={p._id} name={p.name} price={p.price} credits={p.credits} features={p.features || []} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({ name, price, credits, features, highlight }) {
  return (
    <div className={`bg-white p-8 rounded-lg shadow ${highlight ? 'ring-2 ring-primary' : ''}`}>
      {highlight && <span className="bg-primary text-white text-xs px-2 py-1 rounded">POPULAR</span>}
      <h3 className="text-2xl font-bold mt-2">{name}</h3>
      <p className="text-4xl font-bold mt-4">${price}<span className="text-lg text-gray-500">/mo</span></p>
      <p className="text-gray-600 mt-2">{credits} credits/month</p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f, i) => <li key={i}>✓ {f}</li>)}
      </ul>
      <a href="/register" className={`mt-6 block text-center py-2 rounded ${highlight ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
        Get started
      </a>
    </div>
  );
}