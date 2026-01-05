/**
 * Server-side API utilities for static generation
 * These functions can be used in server components and generateStaticParams
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tool_count: number;
}

/**
 * Fetch categories from the API (server-side)
 */
export async function getCategoriesServer(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 }, // Revalidate every hour
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch category by slug (server-side)
 */
export async function getCategoryBySlugServer(slug: string): Promise<Category | null> {
  try {
    const response = await fetch(`${API_URL}/categories/slug/${slug}`, {
      next: { revalidate: 3600 }, // Revalidate every hour
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}
