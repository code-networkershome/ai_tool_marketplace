import { Category } from '@/types';
import CategoryClientPage from './ClientPage';

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
    return <CategoryClientPage />;
}
