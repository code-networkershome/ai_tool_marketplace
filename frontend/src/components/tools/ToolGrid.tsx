'use client';

import { ToolListItem } from '@/types';
import ToolCard from './ToolCard';
import Link from 'next/link';
import { ArrowRight, Search, FolderOpen } from 'lucide-react';

interface ToolGridProps {
  tools: ToolListItem[];
  onSave?: (toolId: string) => void;
  savedTools?: string[];
  isLoading?: boolean;
  showEmpty?: boolean;
  message?: string;
  emptyLink?: string;
  emptyLinkText?: string;
}

export default function ToolGrid({
  tools,
  onSave,
  savedTools = [],
  isLoading,
  showEmpty = false,
  message = 'No tools found',
  emptyLink,
  emptyLinkText = 'Browse categories',
}: ToolGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-xl bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    if (showEmpty) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-primary-100 p-4">
            <Search className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{message}</h3>
          {emptyLink && (
            <Link
              href={emptyLink}
              className="mt-3 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {emptyLinkText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-4">
          <FolderOpen className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No tools found</h3>
        <p className="mt-1 text-gray-500">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-4">
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
