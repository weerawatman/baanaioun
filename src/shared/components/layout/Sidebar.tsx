'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'ทรัพย์สิน', nameEn: 'Assets', href: '/assets', icon: BuildingIcon },
  { name: 'ก่อสร้าง/รีโนเวท', nameEn: 'Construction', href: '/renovations', icon: WrenchIcon },
  { name: 'รายงาน', nameEn: 'Reports', href: '/reports', icon: ChartIcon },
];

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-warm-900 text-warm-50 border-b border-warm-800">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <HomeIcon className="w-6 h-6 text-primary-300" />
            <span className="font-bold text-lg text-primary-300">Baanaioun</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-warm-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div
        className={`lg:hidden fixed top-14 left-0 bottom-16 w-72 bg-warm-900 text-warm-50 z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 h-full overflow-y-auto flex flex-col">
          <ul className="space-y-2 flex-1">
            <li>
              <Link
                href="/"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  pathname === '/'
                    ? 'bg-primary-500 text-white'
                    : 'text-warm-300 hover:bg-warm-800 hover:text-warm-50'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                <div>
                  <div className="font-medium">หน้าหลัก</div>
                  <div className="text-xs text-warm-400">Home</div>
                </div>
              </Link>
            </li>
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-warm-300 hover:bg-warm-800 hover:text-warm-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-warm-400">{item.nameEn}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* User info + logout */}
          {profile && (
            <div className="pt-4 border-t border-warm-800">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
                  {avatarLetter}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-50 truncate">{displayName}</p>
                  <p className="text-xs text-warm-400">
                    {isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 text-sm text-warm-400 hover:text-warm-50 hover:bg-warm-800 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ออกจากระบบ
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-warm-900 border-t border-warm-200 dark:border-warm-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              pathname === '/'
                ? 'text-primary-500 dark:text-primary-400'
                : 'text-warm-500 dark:text-warm-400'
            }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">หน้าหลัก</span>
          </Link>
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-warm-500 dark:text-warm-400'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1 truncate max-w-[60px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-warm-900 text-warm-50 min-h-screen flex-col fixed left-0 top-0 bottom-0">
        <div className="p-6 border-b border-warm-800">
          <Link href="/" className="block">
            <h1 className="text-xl font-bold text-primary-300">Baanaioun</h1>
            <p className="text-sm text-warm-400 mt-1">Property Management</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-warm-300 hover:bg-warm-800 hover:text-warm-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs text-warm-400">{item.nameEn}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-warm-800">
          {profile ? (
            <div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {avatarLetter}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-warm-50 truncate">{displayName}</p>
                  <p className="text-xs text-warm-400">
                    {isAdmin ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm text-warm-400 hover:text-warm-50 hover:bg-warm-800 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <p className="text-xs text-warm-500">Property Renovation Tracker</p>
          )}
        </div>
      </aside>
    </>
  );
}
