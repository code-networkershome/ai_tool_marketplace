'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, ChevronRight, Box, Cpu } from 'lucide-react';
import api from '@/lib/api';
import { Category } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 flex items-center gap-3">
          <Tag className="text-primary-600 h-8 w-8" />
          Browse by Category
        </h1>
        <p className="text-xl text-gray-600">
          Discover the best AI tools across every industry and use case.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group relative flex flex-col p-6 bg-white border border-gray-200 rounded-2xl transition-all hover:shadow-lg hover:border-primary-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <Cpu className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-primary-600 flex items-center gap-1 transition-colors">
                {category.tool_count || 0} Tools
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
              {category.name}
            </h3>
            <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed">
              {category.description || `Explore top-rated ${category.name} tools and applications.`}
            </p>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <Box className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No categories found</h3>
          <p className="text-gray-500">Wait for tools to be categorized by the community.</p>
        </div>
      )}
    </div>
  );
}
