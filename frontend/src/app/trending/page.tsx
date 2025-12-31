'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Filter } from 'lucide-react';
import api from '@/lib/api';
import { ToolListItem } from '@/types';
import ToolCard from '@/components/tools/ToolCard';
import Button from '@/components/ui/Button';

export default function TrendingPage() {
  const [tools, setTools] = useState<ToolListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTrendingTools();
  }, [page]);

  async function fetchTrendingTools() {
    setIsLoading(true);
    try {
      const data = await api.getTools(page, 12, undefined, 'trending');
      if (page === 1) {
        setTools(data.items);
      } else {
        setTools((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.has_next);
    } catch (error) {
      console.error('Failed to fetch trending tools:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold mb-4 uppercase tracking-wider">
          <TrendingUp className="h-4 w-4" />
          Hot & Trending
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Popular AI Tools
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          The fastest growing AI tools based on community engagement, reviews, and traffic.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {isLoading && (
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 w-full animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && tools.length === 0 && (
        <div className="mt-20 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tools found</h3>
          <p className="text-gray-500">Check back later for new trending tools!</p>
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="mt-12 text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
          >
            Load More Tools
          </Button>
        </div>
      )}
    </div>
  );
}
