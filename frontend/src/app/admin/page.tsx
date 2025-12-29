'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  Users,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  MousePointer,
  Bookmark,
  Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { PlatformStats, ToolListItem } from '@/types';
import { formatNumber } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pendingTools, setPendingTools] = useState<ToolListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin');
      return;
    }
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      router.push('/');
      toast.error('Admin access required');
      return;
    }

    async function fetchData() {
      try {
        const [statsData, pendingData] = await Promise.all([
          api.getPlatformStats(),
          api.getPendingTools(1, 5),
        ]);
        setStats(statsData);
        setPendingTools(pendingData.items);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const handleModerate = async (toolId: string, action: 'approve' | 'reject') => {
    try {
      await api.moderateTool(toolId, action);
      setPendingTools((prev) => prev.filter((t) => t.id !== toolId));
      toast.success(`Tool ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} tool`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-white lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold text-gray-900">Admin Panel</span>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg bg-primary-50 px-4 py-2 text-primary-700"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/tools"
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <Box className="h-5 w-5" />
                Tools
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <Users className="h-5 w-5" />
                Users
              </Link>
            </li>
            <li>
              <Link
                href="/admin/analytics"
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <BarChart3 className="h-5 w-5" />
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href="/admin/settings"
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back, {user?.full_name || user?.email}</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tools</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {formatNumber(stats.total_tools)}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Box className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-yellow-600">{stats.tools_pending} pending</span>
                <span className="text-gray-400">|</span>
                <span className="text-green-600">{stats.tools_approved} approved</span>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {formatNumber(stats.total_users)}
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Views</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {formatNumber(stats.total_views_today)}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <MousePointer className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{formatNumber(stats.total_clicks_today)} clicks</span>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Today's Searches</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {formatNumber(stats.total_searches_today)}
                  </p>
                </div>
                <div className="rounded-full bg-orange-100 p-3">
                  <Search className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Bookmark className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{formatNumber(stats.total_saves_today)} saves</span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Tools */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Approvals
            </h2>
            <Link
              href="/admin/tools?status=pending"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>

          {pendingTools.length > 0 ? (
            <div className="mt-4 rounded-xl border bg-white shadow-sm">
              <ul className="divide-y">
                {pendingTools.map((tool) => (
                  <li
                    key={tool.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-4">
                      {tool.logo_url ? (
                        <img
                          src={tool.logo_url}
                          alt={tool.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-500">
                          {tool.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{tool.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {tool.short_description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerate(tool.id, 'reject')}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleModerate(tool.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border bg-white p-8 text-center shadow-sm">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">No pending tools to review</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button
              onClick={async () => {
                try {
                  await api.recalculateRankings();
                  toast.success('Rankings recalculated');
                } catch {
                  toast.error('Failed to recalculate rankings');
                }
              }}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 text-left hover:bg-gray-50"
            >
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Recalculate Rankings</p>
                <p className="text-sm text-gray-500">Update all tool scores</p>
              </div>
            </button>

            <Link
              href="/admin/tools/new"
              className="flex items-center gap-3 rounded-xl border bg-white p-4 text-left hover:bg-gray-50"
            >
              <Box className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Add Internal Tool</p>
                <p className="text-sm text-gray-500">Add a platform-owned tool</p>
              </div>
            </Link>

            <Link
              href="/admin/categories"
              className="flex items-center gap-3 rounded-xl border bg-white p-4 text-left hover:bg-gray-50"
            >
              <Settings className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Categories</p>
                <p className="text-sm text-gray-500">Edit tool categories</p>
              </div>
            </Link>

            <Link
              href="/admin/ranking"
              className="flex items-center gap-3 rounded-xl border bg-white p-4 text-left hover:bg-gray-50"
            >
              <BarChart3 className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Ranking Config</p>
                <p className="text-sm text-gray-500">Adjust ranking weights</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
