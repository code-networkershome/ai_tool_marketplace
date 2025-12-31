'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
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
import api from '@/lib/api';
import { PlatformStats, ToolListItem } from '@/types';
import { formatNumber } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pendingTools, setPendingTools] = useState<ToolListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>

      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tools</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatNumber(stats.total_tools)}</p>
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
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatNumber(stats.total_users)}</p>
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
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatNumber(stats.total_views_today)}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Searches</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{formatNumber(stats.total_searches_today)}</p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <Search className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Tools */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          <Link href="/admin/tools?status=pending" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
        </div>

        {pendingTools && pendingTools.length > 0 ? (
          <div className="mt-4 rounded-xl border bg-white shadow-sm">
            <ul className="divide-y text-sm">
              {pendingTools.map((tool) => (
                <li key={tool.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    {tool.logo_url ? <img src={tool.logo_url} className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded-lg">{tool.name[0]}</div>}
                    <div>
                      <h3 className="font-medium text-gray-900">{tool.name}</h3>
                      <p className="text-gray-500 line-clamp-1">{tool.short_description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleModerate(tool.id, 'reject')} className="text-red-600"><XCircle className="h-4 w-4" /></Button>
                    <Button size="sm" variant="primary" onClick={() => handleModerate(tool.id, 'approve')}><CheckCircle className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border bg-white p-8 text-center"><p className="text-gray-600">No pending tools</p></div>
        )}
      </div>
    </div>
  );
}
