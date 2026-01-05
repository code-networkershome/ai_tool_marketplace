'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Category, ToolListItem, PaginatedResponse } from '@/types';
import ToolCard from '@/components/tools/ToolCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';

// Static generation - this runs at build time
export async function generateStaticParams() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch categories for static generation');
      return [];
    }
    
    const categories = await response.json();
    return categories.map((category: Category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.warn('Error generating static params for categories:', error);
    return [];
  }
}

export default function CategoryPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = params.slug as string;
    const page = parseInt(searchParams.get('page') || '1', 10);

    const [category, setCategory] = useState<Category | null>(null);
    const [toolsData, setToolsData] = useState<PaginatedResponse<ToolListItem> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                // Fetch category by slug
                const catData = await api.getCategoryBySlug(slug);
                setCategory(catData);

                if (catData) {
                    // Fetch tools for this category with pagination
                    const toolsResponse = await api.getCategoryTools(catData.id, page, 20);
                    setToolsData(toolsResponse);
                }
            } catch (err) {
                console.error('Failed to load category data', err);
                setError('Category not found or failed to load.');
            } finally {
                setIsLoading(false);
            }
        }

        if (slug) {
            fetchData();
        }
    }, [slug, page]);

    const handlePageChange = (newPage: number) => {
        router.push(`/categories/${slug}?page=${newPage}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-xl text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Category Not Found</h1>
                    <p className="mt-4 text-gray-500">{error || "The category you're looking for doesn't exist."}</p>
                    <div className="mt-8">
                        <Link href="/categories" className="text-primary-600 hover:text-primary-500 font-medium">
                            &larr; Browse all categories
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const tools = toolsData?.items || [];
    const total = toolsData?.total || 0;

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                    <div className="max-w-3xl">
                        <nav className="mb-4">
                            <Link href="/categories" className="text-sm text-gray-500 hover:text-gray-700">
                                Categories
                            </Link>
                            <span className="mx-2 text-gray-400">/</span>
                            <span className="text-sm text-gray-900 font-medium">{category.name}</span>
                        </nav>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            {category.name} AI Tools
                        </h1>
                        <p className="mt-4 text-lg text-gray-500">
                            {category.description || `Discover the best AI tools for ${category.name}. Hand-picked and verified.`}
                        </p>
                        {category.tool_count > 0 && (
                            <p className="mt-2 text-sm text-gray-400">
                                {total} {total === 1 ? 'tool' : 'tools'} available
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                {tools.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                            {tools.map((tool) => (
                                <ToolCard key={tool.id} tool={tool} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {toolsData && toolsData.pages > 1 && (
                            <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-8">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                                        <span className="font-medium">
                                            {Math.min(page * 20, total)}
                                        </span>{' '}
                                        of <span className="font-medium">{total}</span> results
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={!toolsData.has_prev}
                                        className="flex items-center gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(toolsData.pages, 7) }, (_, i) => {
                                            let pageNum;
                                            if (toolsData.pages <= 7) {
                                                pageNum = i + 1;
                                            } else if (page <= 4) {
                                                pageNum = i + 1;
                                            } else if (page >= toolsData.pages - 3) {
                                                pageNum = toolsData.pages - 6 + i;
                                            } else {
                                                pageNum = page - 3 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                        pageNum === page
                                                            ? 'bg-primary-600 text-white'
                                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={!toolsData.has_next}
                                        className="flex items-center gap-1"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                        <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No tools found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            We haven't added any tools to this category yet.
                        </p>
                        <div className="mt-6">
                            <Link href="/submit">
                                <Button>Submit a Tool</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
