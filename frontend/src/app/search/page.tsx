'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import api from '@/lib/api';
import { ToolListItem, Category, PricingModel } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ToolGrid from '@/components/tools/ToolGrid';
import { getPricingLabel } from '@/lib/utils';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [tools, setTools] = useState<ToolListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<PricingModel[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function search() {
      if (!query.trim()) {
        setTools([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await api.searchTools({
          q: query,
          page,
          limit: 20,
          category_id: selectedCategory || undefined,
          pricing: selectedPricing.length > 0 ? selectedPricing : undefined,
          min_rating: minRating || undefined,
        });
        setTools(page === 1 ? result.items : [...tools, ...result.items]);
        setTotal(result.total);
        setHasMore(result.has_next);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
    search();
  }, [query, page, selectedCategory, selectedPricing, minRating]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedPricing([]);
    setMinRating(null);
    setPage(1);
  };

  const togglePricing = (pricing: PricingModel) => {
    setSelectedPricing((prev) =>
      prev.includes(pricing)
        ? prev.filter((p) => p !== pricing)
        : [...prev, pricing]
    );
    setPage(1);
  };

  const pricingOptions: PricingModel[] = [
    'free',
    'freemium',
    'paid',
    'subscription',
    'open_source',
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search AI tools..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              className="h-12"
            />
          </div>
          <Button type="submit" variant="primary" className="h-12 px-6">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </form>

        {query && (
          <p className="mt-4 text-gray-600">
            {isLoading ? 'Searching...' : `${total} results for "${query}"`}
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`w-64 flex-shrink-0 ${
            showFilters ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="sticky top-24 rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {(selectedCategory || selectedPricing.length > 0 || minRating) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700">Category</h4>
              <div className="mt-2 space-y-2">
                {categories.slice(0, 10).map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category.id}
                      onChange={() => {
                        setSelectedCategory(
                          selectedCategory === category.id ? null : category.id
                        );
                        setPage(1);
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">{category.name}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {category.tool_count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pricing Filter */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700">Pricing</h4>
              <div className="mt-2 space-y-2">
                {pricingOptions.map((pricing) => (
                  <label
                    key={pricing}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPricing.includes(pricing)}
                      onChange={() => togglePricing(pricing)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">
                      {getPricingLabel(pricing)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700">Minimum Rating</h4>
              <div className="mt-2 space-y-2">
                {[4, 3, 2].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => {
                        setMinRating(minRating === rating ? null : rating);
                        setPage(1);
                      }}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">{rating}+ stars</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Active Filters */}
          {(selectedCategory || selectedPricing.length > 0 || minRating) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
              {selectedPricing.map((pricing) => (
                <span
                  key={pricing}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700"
                >
                  {getPricingLabel(pricing)}
                  <button onClick={() => togglePricing(pricing)}>
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
              {minRating && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700">
                  {minRating}+ stars
                  <button onClick={() => setMinRating(null)}>
                    <X className="h-4 w-4" />
                  </button>
                </span>
              )}
            </div>
          )}

          <ToolGrid tools={tools} isLoading={isLoading && page === 1} />

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                isLoading={isLoading}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
