'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                AI_for_X
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Discover the best AI tools for every use case. Compare, rank, and
              find the perfect AI solution for your needs.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900">Categories</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/categories/ai-writing"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  AI Writing
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/ai-image"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  AI Image Generation
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/ai-coding"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  AI Coding
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/ai-productivity"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  AI Productivity
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View all categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-gray-900">Resources</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  API
                </Link>
              </li>
              <li>
                <Link
                  href="/submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Submit a Tool
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900">Company</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AI_for_X. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
