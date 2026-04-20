'use client';

import { useState } from 'react';
import LoginModal from './LoginModal';

interface NavbarProps {
  currentUser: string | null;
  onLogin: (username: string) => void;
  onLogout: () => void;
}

const navLinks = [
  { label: '首頁', href: '#' },
  { label: '學分', href: '#' },
  { label: '課程', href: '#' },
  { label: '畢業門檻', href: '#' },
];

export default function Navbar({ currentUser, onLogin, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-8">
              <a href="#" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
                <span className="text-indigo-400">⛰</span>
                岩壁計算機
              </a>
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Auth */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  <span className="hidden sm:block text-sm text-gray-300">
                    歡迎，<span className="text-white font-medium">{currentUser}</span>
                  </span>
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-300 border border-gray-600 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    登出
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  登入
                </button>
              )}
              <button
                className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={onLogin}
      />
    </>
  );
}
