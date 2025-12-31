'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { Category } from '@/types';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setIsLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setNewCategory({ 
      ...newCategory, 
      name, 
      slug: slugify(name) 
    });
  };

  const handleAdd = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast.error('Name and slug are required');
      return;
    }
    try {
      await api.client.post('/categories', newCategory);
      toast.success('Category added');
      setIsAdding(false);
      setNewCategory({ name: '', slug: '', description: '' });
      fetchCategories();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to add category';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will fail if tools are in this category.')) return;
    try {
      await api.client.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Deletion failed');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize tools by category</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} variant="primary" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Slug</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Tools</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {isAdding && (
              <tr className="bg-primary-50">
                <td className="px-6 py-4">
                  <input
                    autoFocus
                    className="w-full rounded border-gray-300 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    className="w-full rounded border-gray-300 px-2 py-1 text-sm bg-gray-50"
                    placeholder="slug"
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  />
                </td>
                <td className="px-6 py-4 text-gray-400">0</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={handleAdd} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-5 w-5" /></button>
                    <button onClick={() => setIsAdding(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
                  </div>
                </td>
              </tr>
            )}
            {isLoading ? (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500">Loading categories...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500">No categories found</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                  <td className="px-6 py-4 text-gray-600">{cat.tool_count || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button className="text-gray-400 hover:text-primary-600 transition-colors"><Edit2 className="h-4 w-4" /></button>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
