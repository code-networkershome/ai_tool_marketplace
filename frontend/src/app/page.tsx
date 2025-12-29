'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Sparkles, TrendingUp, Star, Zap } from 'lucide-react';
import api from '@/lib/api';
import { ToolListItem, Category } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ToolGrid from '@/components/tools/ToolGrid';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredTools, setFeaturedTools] = useState<ToolListItem[]>([]);
  const [trendingTools, setTrendingTools] = useState<ToolListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [featured, trending, cats] = await Promise.all([
          api.getTools(1, 6, undefined, 'featured'),
          api.getTools(1, 6, undefined, 'trending'),
          api.getCategories(true),
        ]);
        setFeaturedTools(featured.items);
        setTrendingTools(trending.items);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 py-20 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
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

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mx-auto mt-10 max-w-2xl"
            >
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search AI tools... (e.g., 'writing assistant', 'image generator')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-5 w-5" />}
                  className="h-14 text-lg shadow-xl"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="absolute right-2 top-2 h-10"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Quick stats */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span>5,000+ AI Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-300" />
                <span>50+ Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-300" />
                <span>Updated Daily</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <Link
              href="/categories"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex items-center gap-4 rounded-xl border bg-white p-4 transition-all hover:border-primary-200 hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon || '🤖'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.tool_count} tools
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Tools</h2>
            </div>
            <Link
              href="/featured"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            <ToolGrid tools={featuredTools} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* Trending Tools Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
            </div>
            <Link
              href="/trending"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            <ToolGrid tools={trendingTools} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-600 to-accent-600 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Have an AI Tool to Share?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-100">
            Submit your AI tool and reach thousands of potential users. Our
            automated extraction makes it easy to get listed.
          </p>
          <Link href="/submit">
            <Button
              variant="secondary"
              size="lg"
              className="mt-8"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Submit Your Tool
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
