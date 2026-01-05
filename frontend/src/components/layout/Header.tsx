'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  Plus,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              AI_for_X
            </span>
          </Link>

          {/* Search - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex md:flex-1 md:max-w-xl md:mx-8"
          >
            <Input
              type="search"
              placeholder="Search AI tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="w-full"
            />
          </form>

          {/* Nav - Desktop */}
          <nav className="hidden md:flex md:items-center md:gap-4">
            <Link
              href="/categories"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Categories
            </Link>
            <Link
              href="/trending"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Trending
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/submit">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                    Submit Tool
                  </Button>
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 rounded-full bg-gray-100 p-2 hover:bg-gray-200"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'User'}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-600" />
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg">
                      <div className="border-b px-4 py-2">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.full_name || user?.email}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>

                      {user?.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-lg p-2 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <form onSubmit={handleSearch} className="mb-4">
              <Input
                type="search"
                placeholder="Search AI tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </form>

            <nav className="flex flex-col gap-2">
              <Link
                href="/categories"
                className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                Categories
              </Link>
              <Link
                href="/trending"
                className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
              >
                Trending
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    Account Settings
                  </Link>
                  <Link
                    href="/submit"
                    className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    Submit Tool
                  </Link>
                  <button
                    onClick={logout}
                    className="rounded-lg px-3 py-2 text-left text-red-600 hover:bg-gray-100"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-primary-600 px-3 py-2 text-center text-white"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
