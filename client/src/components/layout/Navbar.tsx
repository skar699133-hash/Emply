import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Sparkles,
  Inbox,
  CalendarDays,
  BookOpen,
  HeartHandshake,
  Users2,
  ShieldCheck,
  Settings,
  LogOut,
  LogIn,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isManager = user?.role === 'MANAGER' || user?.role === 'SKIP_LEVEL_MANAGER' || user?.role === 'HR_DIRECTOR' || user?.role === 'ADMIN';
  const isHRorHigher = user?.role === 'SKIP_LEVEL_MANAGER' || user?.role === 'HR_DIRECTOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const navLinks = [
    { label: 'Ask AI', path: '/', icon: Sparkles },
    { label: 'My Requests', path: '/requests', icon: Inbox },
    { label: 'Leave Hub', path: '/leave', icon: CalendarDays },
    { label: 'Policies', path: '/policies', icon: BookOpen },
    { label: 'Advocacy', path: '/advocacy', icon: HeartHandshake },
  ];

  if (isManager) {
    navLinks.push({ label: 'Manager Hub', path: '/manager', icon: Users2 });
  }

  if (isHRorHigher) {
    navLinks.push({ label: 'HR & Higher Reviews', path: '/hr', icon: ShieldCheck });
  }

  if (isAdmin) {
    navLinks.push({ label: 'Admin Console', path: '/admin', icon: Settings });
  }

  return (
    <header className="bg-white/95 border-b border-[#BDC3C7] backdrop-blur-md sticky top-8 z-40 shadow-[0_1px_3px_rgba(44,62,80,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#2C3E50] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-[#ECF0F1]" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-[#2C3E50]">
                  NEXORA
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] tracking-wider uppercase font-semibold text-[#2C3E50] bg-[#ECF0F1] px-2 py-0.5 rounded border border-[#BDC3C7]">
                  Workplace Operations
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7] font-semibold shadow-xs'
                      : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right utilities */}
          <div className="flex items-center gap-3">
            <NotificationDropdown />

            {/* Profile widget */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#BDC3C7]">
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#BDC3C7] shadow-xs"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-[#2C3E50] leading-tight">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-[#7F8C8D] leading-tight">
                    {user.jobTitle || 'Team Member'}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    window.location.href = '/login';
                  }}
                  title="Sign Out / Switch to Login Page"
                  className="p-1.5 rounded-lg text-[#7F8C8D] hover:text-[#C83D4B] hover:bg-[#ECF0F1] transition-colors ml-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2C3E50] text-white text-xs font-semibold hover:bg-[#34495E] transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-[#BDC3C7] scrollbar-none">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7] font-semibold'
                    : 'text-[#7F8C8D] hover:text-[#2C3E50] hover:bg-[#ECF0F1]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
