import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'AI_for_X - Discover the Best AI Tools',
    template: '%s | AI_for_X',
  },
  description:
    'Discover, compare, and rank AI tools for every use case. Find the perfect AI solution for writing, coding, design, productivity, and more.',
  keywords: [
    'AI tools',
    'artificial intelligence',
    'machine learning',
    'AI directory',
    'AI marketplace',
  ],
  authors: [{ name: 'AI_for_X' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AI_for_X',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
