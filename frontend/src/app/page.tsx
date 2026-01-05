'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Category } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// Tool card component inline
function ToolCard({ tool }: { tool: { id: string; name: string; short_description?: string; logo_url?: string } }) {
  return (
    <Link href={`/tools/${tool.id}`} className="block">
      <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          {tool.logo_url ? (
            <img src={tool.logo_url} alt={tool.name} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
              {tool.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{tool.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{tool.short_description || 'No description'}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Category card component inline
function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`} className="flex items-center gap-4 rounded-xl border p-4 hover:shadow-md transition-all">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl bg-primary-100">
        {category.icon || '🤖'}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{category.name}</h3>
        <p className="text-sm text-gray-500">{category.tool_count || 0} tools</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTools, setFeaturedTools] = useState<unknown[]>([]);
  const [trendingTools, setTrendingTools] = useState<unknown[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const headers = { 'Content-Type': 'application/json' };

    // Track API call failures
    let failedCalls = 0;
    const totalCalls = 3;

    const checkAllFailed = () => {
      failedCalls++;
      if (failedCalls === totalCalls) {
        setBackendError('Backend connection failed');
      }
    };

    // Fetch featured tools
    fetch(`${API_URL}/tools?page=1&limit=4&ranking_type=featured`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Featured tools API returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Featured tools loaded:', data.items?.length || 0);
        setFeaturedTools(data.items || []);
        setBackendError(null); // Clear error on success
      })
      .catch(err => {
        console.error('Failed to fetch featured tools:', err);
        checkAllFailed();
      })
      .finally(() => setIsLoadingFeatured(false));

    // Fetch trending tools
    fetch(`${API_URL}/tools?page=1&limit=4&ranking_type=trending`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Trending tools API returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Trending tools loaded:', data.items?.length || 0);
        setTrendingTools(data.items || []);
        setBackendError(null); // Clear error on success
      })
      .catch(err => {
        console.error('Failed to fetch trending tools:', err);
        checkAllFailed();
      })
      .finally(() => setIsLoadingTrending(false));

    // Fetch categories
    fetch(`${API_URL}/categories`, { headers })
      .then(res => {
        if (!res.ok) throw new Error(`Categories API returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Categories loaded:', data?.length || 0);
        setCategories(data || []);
        setBackendError(null); // Clear error on success
      })
      .catch(err => {
        console.error('Failed to fetch categories:', err);
        checkAllFailed();
      })
      .finally(() => setIsLoadingCategories(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div>
      {/* Backend Error Warning Banner */}
      {backendError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-800 text-sm">
                ⚠️ {backendError}. Make sure the backend is running at <code className="bg-yellow-100 px-1 rounded">http://localhost:8000</code>
              </span>
            </div>
            <button onClick={() => window.location.reload()} className="text-yellow-800 text-sm font-medium hover:underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 py-20 text-white">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Discover the Best{' '}
              <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                AI Tools
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100">
              Explore thousands of AI tools for writing, coding, design, productivity,
              and more. Find the perfect AI solution for your needs.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-10 max-w-2xl">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search AI tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-5 w-5" />}
                  className="h-14 text-lg shadow-xl border-0"
                />
                <Button type="submit" variant="primary" className="absolute right-2 top-2 h-10">
                  Search
                </Button>
              </div>
            </form>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span>5,000+ AI Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <span>50+ Categories</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
            <Link href="/categories" className="flex items-center gap-1 text-sm font-medium text-primary-600">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoadingCategories ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border bg-gray-100 p-4 h-20" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No categories found</p>
          )}
        </div>
      </section>

      {/* Featured Tools */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Tools</h2>
          {isLoadingFeatured ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : featuredTools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredTools.map((tool: unknown) => {
                const t = tool as { id: string; name: string; short_description?: string; logo_url?: string };
                return <ToolCard key={t.id} tool={t} />;
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No featured tools yet</p>
          )}
        </div>
      </section>

      {/* Trending Tools */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Trending Now</h2>
          {isLoadingTrending ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : trendingTools.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trendingTools.map((tool: unknown) => {
                const t = tool as { id: string; name: string; short_description?: string; logo_url?: string };
                return <ToolCard key={t.id} tool={t} />;
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No trending tools yet</p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold">Have an AI Tool to Share?</h2>
          <p className="mx-auto mt-4 max-w-2xl">
            Submit your AI tool and reach thousands of potential users.
          </p>
          <Link href="/submit">
            <Button variant="secondary" size="lg" className="mt-8" rightIcon={<ArrowRight className="h-5 w-5" />}>
              Submit Your Tool
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
