import Link from 'next/link';
import axios from 'axios';

async function getPlans() {
  try {
    const res = await axios.get('http://localhost:3000/api/payments/plans');
    return res.data.plans;
  } catch {
    return {
      basic: { price: 9.99, name: 'Basic', bots: 3, messages: 1000 },
      premium: { price: 29.99, name: 'Premium', bots: 10, messages: 10000 },
      enterprise: { price: 99.99, name: 'Enterprise', bots: 50, messages: 100000 }
    };
  }
}

export default async function Pricing() {
  const plans = await getPlans();
  const planKeys = Object.keys(plans);

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 text-center mb-12">Select the perfect plan for your needs</p>

        <div className="grid md:grid-cols-3 gap-8">
          {planKeys.map((key) => {
            const plan = plans[key];
            return (
              <div key={key} className="card text-center">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <div className="text-4xl font-bold text-primary mb-4">
                  ${plan.price}<span className="text-lg text-gray-500">/month</span>
                </div>
                <ul className="text-left mb-6 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {plan.bots} bots
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> {plan.messages.toLocaleString()} messages/month
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> All integrations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Priority support
                  </li>
                </ul>
                <Link href={`/register?plan=${key}`} className="btn btn-primary w-full">
                  Get Started
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Need a custom plan?</h2>
          <p className="text-gray-600 mb-6">Contact us for enterprise solutions</p>
          <a href="mailto:support@telegram-ai-bot.com" className="btn btn-secondary">
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}