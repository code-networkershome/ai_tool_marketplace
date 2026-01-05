import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog - AI_for_X',
  description: 'Latest news, updates, and insights about AI tools and technology.',
};

const blogPosts = [
  {
    id: 1,
    title: 'The Rise of AI Writing Tools in 2024',
    excerpt: 'How AI writing assistants are transforming content creation across industries.',
    date: '2024-01-15',
    category: 'AI Writing',
    slug: 'rise-of-ai-writing-tools-2024',
  },
  {
    id: 2,
    title: 'Top 10 AI Image Generators Compared',
    excerpt: 'A comprehensive comparison of the leading AI image generation tools.',
    date: '2024-01-10',
    category: 'AI Image',
    slug: 'top-10-ai-image-generators',
  },
  {
    id: 3,
    title: 'AI Coding Assistants: Which One is Right for You?',
    excerpt: 'Comparing GitHub Copilot, Claude Code, and other AI programming tools.',
    date: '2024-01-05',
    category: 'AI Coding',
    slug: 'ai-coding-assistants-comparison',
  },
  {
    id: 4,
    title: 'The Future of AI in Business Productivity',
    excerpt: 'How AI tools are reshaping workflows and increasing productivity.',
    date: '2024-01-01',
    category: 'Productivity',
    slug: 'ai-business-productivity-future',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 to-accent-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white">Blog</h1>
          <p className="mt-4 text-xl text-primary-100">
            Latest news, updates, and insights about AI tools and technology
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    {post.category}
                  </span>
                  <time className="text-sm text-gray-500">{post.date}</time>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-gray-900">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary-600">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-gray-600">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Read more
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State Message */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            More articles coming soon! Subscribe to our newsletter for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
