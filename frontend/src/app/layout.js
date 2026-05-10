import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Telegram AI Bot Platform',
  description: 'Create AI-powered Telegram bots with payments and integrations',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <a href="/" className="text-xl font-bold text-primary">Telegram AI Bots</a>
              </div>
              <div className="flex space-x-4">
                <a href="/dashboard" className="text-gray-700 hover:text-primary">Dashboard</a>
                <a href="/pricing" className="text-gray-700 hover:text-primary">Pricing</a>
                <a href="/login" className="text-gray-700 hover:text-primary">Login</a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}