import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Create AI-Powered Telegram Bots
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build intelligent Telegram bots with AI capabilities, integrated payments, and powerful integrations.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
              Get Started Free
            </Link>
            <Link href="/demo" className="btn btn-secondary text-lg px-8 py-3">
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600">Integrate GPT-4, Claude, and other AI models into your bots</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Payments</h3>
              <p className="text-gray-600">Accept payments via Stripe, Binance, USDT, and PayPal</p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-2">Integrations</h3>
              <p className="text-gray-600">Connect with GitHub, Discord, Slack, and Google</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of users building AI bots</p>
          <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
            Create Your First Bot
          </Link>
        </div>
      </section>
    </div>
  );
}