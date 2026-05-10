import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Telegram AI Bot Platform',
  description: 'Create AI-powered Telegram bots',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between h-14 items-center">
              <a href="/" className="text-lg font-bold text-primary">🤖 AI Bot</a>
              <div className="flex items-center gap-4 text-sm">
                <a href="/dashboard" className="text-gray-600 hover:text-primary">Dashboard</a>
                <a href="/chat" className="text-gray-600 hover:text-primary">Chat</a>
                <a href="/integrations" className="text-gray-600 hover:text-primary">Telegram</a>
                <a href="/pricing" className="text-gray-600 hover:text-primary">Pricing</a>
                <a href="/profile" className="text-gray-600 hover:text-primary">Profile</a>
                <a href="/login" className="text-gray-600 hover:text-primary">Login</a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}