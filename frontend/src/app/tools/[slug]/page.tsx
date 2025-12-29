'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ExternalLink,
  Star,
  Bookmark,
  Share2,
  Github,
  Twitter,
  Globe,
  FileText,
  MessageCircle,
  TrendingUp,
  Award,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { Tool, Review } from '@/types';
import { getPricingLabel, getPricingColor, formatDate, formatNumber } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StarRating from '@/components/ui/StarRating';
import toast from 'react-hot-toast';

export default function ToolDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useAuth();

  const [tool, setTool] = useState<Tool | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function fetchTool() {
      try {
        const toolData = await api.getToolBySlug(slug);
        setTool(toolData);

        const reviewsData = await api.getToolReviews(toolData.id, 1, 10);
        setReviews(reviewsData.items);
      } catch (error) {
        console.error('Failed to fetch tool:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTool();
  }, [slug]);

  const handleVisit = async () => {
    if (tool) {
      await api.recordClick(tool.id, 'detail_page');
      window.open(tool.website_url, '_blank');
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save tools');
      return;
    }
    if (tool) {
      try {
        if (isSaved) {
          await api.unsaveTool(tool.id);
          setIsSaved(false);
          toast.success('Tool removed from saved');
        } else {
          await api.saveTool(tool.id);
          setIsSaved(true);
          toast.success('Tool saved!');
        }
      } catch {
        toast.error('Failed to update saved tools');
      }
    }
  };

  const handleShare = () => {
    if (navigator.share && tool) {
      navigator.share({
        title: tool.name,
        text: tool.short_description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-full max-w-2xl rounded bg-gray-200" />
          <div className="mt-8 h-96 rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Tool not found</h1>
          <p className="mt-2 text-gray-600">
            The tool you're looking for doesn't exist.
          </p>
          <Link href="/">
            <Button className="mt-4">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href="/tools" className="text-gray-500 hover:text-gray-700">
              Tools
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{tool.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="flex items-start gap-6">
            {tool.logo_url ? (
              <Image
                src={tool.logo_url}
                alt={tool.name}
                width={80}
                height={80}
                className="rounded-2xl"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-3xl font-bold text-white">
                {tool.name.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
                {tool.is_verified && (
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                )}
              </div>

              {/* Badges */}
              <div className="mt-2 flex flex-wrap gap-2">
                {tool.is_sponsored && (
                  <Badge variant="sponsored">
                    <Award className="mr-1 h-3 w-3" /> Sponsored
                  </Badge>
                )}
                {tool.is_featured && (
                  <Badge variant="featured">
                    <Star className="mr-1 h-3 w-3" /> Featured
                  </Badge>
                )}
                {tool.is_trending && (
                  <Badge variant="trending">
                    <TrendingUp className="mr-1 h-3 w-3" /> Trending
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-4">
                <StarRating
                  rating={tool.average_rating}
                  showValue
                  reviewCount={tool.review_count}
                  size="md"
                />
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${getPricingColor(tool.pricing_model)}`}>
                  {getPricingLabel(tool.pricing_model)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <p className="text-lg text-gray-600">{tool.short_description}</p>
            {tool.long_description && (
              <div className="mt-4 prose prose-gray max-w-none">
                <p>{tool.long_description}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {tool.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Use Cases */}
          {tool.use_cases.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Use Cases</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                {tool.use_cases.map((useCase, index) => (
                  <li key={index}>{useCase}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          <div className="mt-8 grid grid-cols-4 gap-4 rounded-xl border bg-gray-50 p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(tool.view_count)}
              </p>
              <p className="text-sm text-gray-500">Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(tool.click_count)}
              </p>
              <p className="text-sm text-gray-500">Clicks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(tool.save_count)}
              </p>
              <p className="text-sm text-gray-500">Saves</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {tool.average_rating.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500">Rating</p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Reviews ({tool.review_count})
              </h2>
              {isAuthenticated && (
                <Button variant="outline" size="sm">
                  Write a Review
                </Button>
              )}
            </div>

            {reviews.length > 0 ? (
              <div className="mt-6 space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <StarRating rating={review.rating} size="sm" />
                        {review.title && (
                          <h4 className="mt-1 font-medium text-gray-900">
                            {review.title}
                          </h4>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    {review.content && (
                      <p className="mt-2 text-gray-600">{review.content}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-gray-500">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Action Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <Button
                onClick={handleVisit}
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={<ExternalLink className="h-5 w-5" />}
              >
                Visit Website
              </Button>

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleSave}
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />}
                >
                  {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1"
                  leftIcon={<Share2 className="h-4 w-4" />}
                >
                  Share
                </Button>
              </div>

              {/* Pricing */}
              {tool.pricing_details && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-medium text-gray-900">Pricing</h3>
                  <p className="mt-1 text-sm text-gray-600">{tool.pricing_details}</p>
                  {tool.starting_price && (
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      From ${tool.starting_price}/mo
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Links Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-medium text-gray-900">Links</h3>
              <div className="mt-4 space-y-3">
                <a
                  href={tool.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
                {tool.docs_url && (
                  <a
                    href={tool.docs_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <FileText className="h-4 w-4" />
                    Documentation
                  </a>
                )}
                {tool.github_url && (
                  <a
                    href={tool.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {tool.twitter_url && (
                  <a
                    href={tool.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {tool.discord_url && (
                  <a
                    href={tool.discord_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-600 hover:text-primary-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Discord
                  </a>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-medium text-gray-900">Information</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Added</dt>
                  <dd className="text-gray-900">{formatDate(tool.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Updated</dt>
                  <dd className="text-gray-900">{formatDate(tool.updated_at)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
