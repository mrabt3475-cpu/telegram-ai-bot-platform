'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/billing', label: 'Billing' },
  { href: '/integrations', label: 'Telegram' },
  { href: '/pricing', label: 'Pricing' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          <Link href="/" className="text-lg font-bold text-primary">🚀 AI Bot</Link>
          <div className="flex items-center gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}
              >
                {l.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="text-gray-600 hover:text-primary">{user?.name || 'Profile'}</Link>
                <button onClick={logout} className="text-red-500 hover:text-red-700">Logout</button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-primary">Login</Link>
                <Link href="/register" className="bg-primary text-white px-3 py-1 rounded">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}