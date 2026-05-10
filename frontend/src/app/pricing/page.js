'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Pricing() {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/payments/plans').then((res) => {
      setPlans(res.data.plans);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);


  const handleSubscribe = async (plan) => {
    const token = localStorage.getItem('token');
    if (!token) return window.location.href = '/login';
    try {
      const res = await axios.post('http://localhost:3000/api/payments/stripe/create-session',
        { plan }, { headers: { Authorization: `Bearer ${token}` } });
      window.location.href = res.data.url;
    } catch (err) {
      alert('Error creating payment session');
    }
  };

  const planList = [
    { key: 'free', name: 'Free', price: 0, bots: 1, messages: 100, features: ['1 Bot', '100 messages/month', 'Basic support'] },
    { key: 'basic', name: 'Basic', price: 9.99, bots: 3, messages: 1000, features: ['3 Bots', '1000 messages/month', 'Email support', 'Basic integrations'] },
    { key: 'premium', name: 'Premium', price: 29.99, bots: 10, messages: 10000, features: ['10 Bots', '10000 messages/month', 'Priority support', 'All integrations'] },
    { key: 'enterprise', name: 'Enterprise', price: 99.99, bots: 50, messages: 100000, features: ['50 Bots', '100000 messages/month', '24/7 Support', 'Custom integrations', 'Dedicated server'] }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Pricing Plans</h1>
        <p className="text-xl text-gray-600 text-center mb-12">Choose the plan that fits your needs</p>
        <div className="grid md:grid-cols-4 gap-6">
          {planList.map((plan) => (
            <div key={plan.key} className={`card ${plan.key === 'premium' ? 'border-2 border-primary' : ''}`}>
              {plan.key === 'premium' && <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">Popular</span>}
              <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="text-gray-600">{plan.bots} Bot{plan.bots > 1 ? 's' : ''}</li>
                <li className="text-gray-600">{plan.messages.toLocaleString()} messages/month</li>
                {plan.features.map((f, i) => <li key={i} className="text-gray-600">✓ {f}</li>)}
              </ul>
              <button onClick={() => handleSubscribe(plan.key)} className={`btn w-full ${plan.key === 'free' ? 'btn-secondary' : 'btn-primary'}`}>
                {plan.key === 'free' ? 'Get Started' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}