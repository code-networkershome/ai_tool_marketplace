'use client';

import { ToolListItem } from '@/types';
import ToolCard from './ToolCard';

interface ToolGridProps {
  tools: ToolListItem[];
  onSave?: (toolId: string) => void;
  savedTools?: string[];
  isLoading?: boolean;
}

export default function ToolGrid({
  tools,
  onSave,
  savedTools = [],
  isLoading,
}: ToolGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-4">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No tools found</h3>
        <p className="mt-1 text-gray-500">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onSave={onSave}
          isSaved={savedTools.includes(tool.id)}
        />
      ))}
    </div>
  );
}
