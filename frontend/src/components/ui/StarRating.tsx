'use client';

import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRatingStars } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export default function StarRating({
  rating,
  size = 'sm',
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const { full, half, empty } = getRatingStars(rating);

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {[...Array(full)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizes[size], 'fill-yellow-400 text-yellow-400')}
          />
        ))}
        {half && (
          <StarHalf
            className={cn(sizes[size], 'fill-yellow-400 text-yellow-400')}
          />
        )}
        {[...Array(empty)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizes[size], 'text-gray-300')}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
}
