'use client';

import { useState, useEffect, Suspense } from 'react';
import {
  Box,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  Eye,
  Sparkles
} from 'lucide-react';
import api from '@/lib/api';
import { ToolListItem, Category } from '@/types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminToolsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || '';

  const [tools, setTools] = useState<ToolListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setPages] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
    fetchCategories();
  }, [page, statusFilter]);

  async function fetchCategories() {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  }

  async function fetchTools() {
    setIsLoading(true);
    try {
      // Use the dedicated admin endpoint for all queries
      const data = await api.getAdminTools(page, 20, statusFilter);
      setTools(data.items);
      setPages(data.pages);
    } catch (error) {
      toast.error('Failed to load tools');
    } finally {
      setIsLoading(false);
    }
  }

  const handleAction = async (toolId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'delete') {
        if (confirm('Are you sure you want to delete this tool?')) {
          await api.deleteTool(toolId);
          toast.success('Tool deleted');
        } else return;
      } else {
        await api.moderateTool(toolId, action);
        toast.success(`Tool ${action}d successfully`);
      }
      fetchTools();
    } catch (error) {
      toast.error(`Operation failed`);
    }
  };

  const handleCategoryChange = async (toolId: string, categoryId: string) => {
    try {
      await api.updateTool(toolId, { category_id: categoryId });
      toast.success('Category updated');
      setTools(prev => prev.map(t => t.id === toolId ? { ...t, category_id: categoryId } : t));
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleAutoCategorize = async (toolId: string) => {
    setProcessingId(toolId);
    try {
      const res = await api.client.post(`/admin/tools/${toolId}/auto-categorize`);
      toast.success(`Categorized as: ${res.data.category_name}`);
      fetchTools();
    } catch (error) {
      toast.error('AI categorization failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tools Management</h1>
          <p className="text-gray-600">Approve, edit, or remove tools from the platform</p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
            value={statusFilter}
            onChange={(e) => router.push(`/admin/tools?status=${e.target.value}`)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Tool</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Category / AI</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : tools.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-gray-500">No tools found</td></tr>
            ) : (
              tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {tool.logo_url ? (
                        <img src={tool.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 bg-gray-100 flex items-center justify-center rounded font-bold text-gray-400">
                          {tool.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{tool.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{tool.website_url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded border-gray-300 text-xs focus:ring-primary-500 focus:border-primary-500 py-1"
                        value={tool.category_id || ''}
                        onChange={(e) => handleCategoryChange(tool.id, e.target.value)}
                      >
                        <option value="">Uncategorized</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAutoCategorize(tool.id)}
                        disabled={processingId === tool.id}
                        className={`p-1.5 rounded-md transition-colors ${processingId === tool.id
                          ? 'bg-gray-100 text-gray-400 animate-pulse'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          }`}
                        title="Auto-categorize with GPT"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tool.status === 'approved' ? 'bg-green-100 text-green-800' :
                      tool.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                      {tool.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {tool.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleAction(tool.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700 h-8 px-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(tool.id, 'reject')}
                            className="text-orange-600 h-8 px-2"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <button
                        onClick={() => handleAction(tool.id, 'delete')}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <a href={`/tools/${tool.slug}`} target="_blank" className="p-2 text-gray-400 hover:text-gray-600">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded border ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminToolsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading tools...</div>}>
      <AdminToolsContent />
    </Suspense>
  );
}
