'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Bookmark, TrendingUp, Star, Award } from 'lucide-react';
import { ToolListItem } from '@/types';
import { cn, getPricingLabel, getPricingColor, truncate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import api from '@/lib/api';

interface ToolCardProps {
  tool: ToolListItem;
  onSave?: (toolId: string) => void;
  isSaved?: boolean;
}

export default function ToolCard({ tool, onSave, isSaved }: ToolCardProps) {
  const handleVisitWebsite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Record the click
      await api.recordClick(tool.id, 'tool_card');
    } catch (error) {
      console.error('Failed to record click:', error);
    }

    // Open in new tab
    window.open(tool.website_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md',
        tool.is_sponsored && 'border-amber-200 bg-amber-50/30',
        tool.is_featured && 'border-purple-200 bg-purple-50/30'
      )}
    >
      {/* Badges */}
      <div className="absolute -top-2 right-4 flex gap-1">
        {tool.is_sponsored && (
          <Badge variant="sponsored" size="sm">
            <Award className="mr-1 h-3 w-3" />
            Sponsored
          </Badge>
        )}
        {tool.is_featured && (
          <Badge variant="featured" size="sm">
            <Star className="mr-1 h-3 w-3" />
            Featured
          </Badge>
        )}
        {tool.is_trending && (
          <Badge variant="trending" size="sm">
            <TrendingUp className="mr-1 h-3 w-3" />
            Trending
          </Badge>
        )}
      </div>

      {/* Save button */}
      {onSave && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onSave(tool.id);
          }}
          className={cn(
            'absolute right-4 top-4 rounded-full p-2 transition-colors',
            isSaved
              ? 'bg-primary-100 text-primary-600'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
          )}
        >
          <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
        </button>
      )}

      <Link href={`/tools/${tool.slug}`} className="block">
        {/* Logo and Name */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {tool.logo_url ? (
              <Image
                src={tool.logo_url}
                alt={tool.name}
                width={56}
                height={56}
                className="rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-xl font-bold text-white">
                {tool.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {tool.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {truncate(tool.short_description, 100)}
            </p>
          </div>
        </div>

        {/* Tags */}
        {tool.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tool.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {tag}
              </span>
            ))}
            {tool.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{tool.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-3">
            {/* Rating */}
            <StarRating
              rating={tool.average_rating}
              reviewCount={tool.review_count}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Pricing */}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                getPricingColor(tool.pricing_model)
              )}
            >
              {getPricingLabel(tool.pricing_model)}
            </span>
          </div>
        </div>
      </Link>

      {/* Visit Website Button - Outside the Link */}
      <button
        onClick={handleVisitWebsite}
        className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Visit Website
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
