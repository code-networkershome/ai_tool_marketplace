import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guides - AI_for_X',
  description: 'Learn how to get the most out of AI tools with our comprehensive guides.',
};

const guides = [
  {
    id: 1,
    title: 'Getting Started with AI Writing Tools',
    excerpt: 'A beginner guide to using AI writing assistants effectively.',
    category: 'Writing',
    level: 'Beginner',
    duration: '10 min read',
  },
  {
    id: 2,
    title: 'How to Use AI for Code Generation',
    excerpt: 'Best practices for leveraging AI coding assistants in your projects.',
    category: 'Coding',
    level: 'Intermediate',
    duration: '15 min read',
  },
  {
    id: 3,
    title: 'Mastering AI Image Prompts',
    excerpt: 'Learn how to craft the perfect prompts for AI image generators.',
    category: 'Image',
    level: 'Beginner',
    duration: '8 min read',
  },
  {
    id: 4,
    title: 'AI Tools for Business Automation',
    excerpt: 'Streamline your business processes with AI automation tools.',
    category: 'Productivity',
    level: 'Advanced',
    duration: '20 min read',
  },
  {
    id: 5,
    title: 'Comparing AI Chatbots for Customer Support',
    excerpt: 'Evaluate and implement AI chatbots for your support workflow.',
    category: 'Business',
    level: 'Intermediate',
    duration: '12 min read',
  },
  {
    id: 6,
    title: 'AI Ethics and Best Practices',
    excerpt: 'Understanding the ethical considerations when using AI tools.',
    category: 'General',
    level: 'Beginner',
    duration: '10 min read',
  },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-accent-600 to-primary-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white">Guides</h1>
          <p className="mt-4 text-xl text-accent-100">
            Learn how to get the most out of AI tools with our comprehensive guides
          </p>
        </div>
      </div>

      {/* Guides */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4">
          <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none">
            <option value="">All Categories</option>
            <option value="writing">Writing</option>
            <option value="coding">Coding</option>
            <option value="image">Image</option>
            <option value="productivity">Productivity</option>
          </select>
          <select className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none">
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Guide Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
                  {guide.category}
                </span>
                <span className="text-xs text-gray-500">{guide.duration}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">
                {guide.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600">{guide.excerpt}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {guide.level}
                </span>
                <Link
                  href={`/guides/${guide.id}`}
                  className="text-sm font-medium text-accent-600 hover:text-accent-700"
                >
                  Read Guide →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            More guides coming soon! Let us know what topics you'd like to see.
          </p>
        </div>
      </div>
    </div>
  );
}
