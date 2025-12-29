'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Loader2, CheckCircle, Edit2, Send, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { ToolExtractionResult } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

type Step = 'url' | 'preview' | 'success';

export default function SubmitToolPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('url');
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<ToolExtractionResult | null>(null);
  const [submittedToolSlug, setSubmittedToolSlug] = useState<string | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to submit a tool');
      router.push('/login?redirect=/submit');
      return;
    }

    setIsExtracting(true);

    try {
      const data = await api.extractToolFromUrl(url);
      setExtractedData(data);
      setStep('preview');
      toast.success('Data extracted successfully!');
    } catch (error) {
      toast.error('Failed to extract data from URL. Please try again.');
      console.error(error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (!extractedData) return;

    setIsSubmitting(true);

    try {
      const tool = await api.submitToolFromUrl(url);
      setSubmittedToolSlug(tool.slug);
      setStep('success');
      toast.success('Tool submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit tool. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                step === 'url'
                  ? 'bg-primary-600 text-white'
                  : 'bg-primary-100 text-primary-600'
              }`}
            >
              {step !== 'url' ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Enter URL</span>
          </div>

          <div className="mx-4 h-px w-16 bg-gray-300" />

          <div className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                step === 'preview'
                  ? 'bg-primary-600 text-white'
                  : step === 'success'
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step === 'success' ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Preview</span>
          </div>

          <div className="mx-4 h-px w-16 bg-gray-300" />

          <div className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                step === 'success'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step === 'success' ? <CheckCircle className="h-5 w-5" /> : '3'}
            </div>
            <span className="ml-2 text-sm font-medium">Submit</span>
          </div>
        </div>
      </div>

      {/* Step 1: URL Input */}
      {step === 'url' && (
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Submit Your AI Tool</h1>
          <p className="mt-4 text-gray-600">
            Enter your tool's website URL and we'll automatically extract all the
            information using AI.
          </p>

          <form onSubmit={handleExtract} className="mt-8">
            <div className="relative">
              <Input
                type="url"
                placeholder="https://your-tool.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                leftIcon={<Link2 className="h-5 w-5" />}
                className="h-14 text-lg"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-4 w-full"
              isLoading={isExtracting}
              rightIcon={!isExtracting && <ArrowRight className="h-5 w-5" />}
            >
              {isExtracting ? 'Extracting Data...' : 'Extract Tool Data'}
            </Button>
          </form>

          <div className="mt-8 rounded-xl bg-gray-50 p-6 text-left">
            <h3 className="font-medium text-gray-900">What happens next?</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                Our AI scrapes your website and extracts key information
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                We automatically categorize and tag your tool
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                You can review and edit the extracted data
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                Your tool goes live after a quick review
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && extractedData && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Preview Your Listing</h1>
          <p className="mt-2 text-gray-600">
            Review the extracted information and make any necessary edits.
          </p>

          <div className="mt-8 space-y-6">
            {/* Tool Preview Card */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {extractedData.logo_url ? (
                  <img
                    src={extractedData.logo_url}
                    alt={extractedData.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-2xl font-bold text-white">
                    {extractedData.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {extractedData.name}
                  </h2>
                  <p className="mt-1 text-gray-600">
                    {extractedData.short_description}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Category</span>
                  <p className="text-gray-900">{extractedData.category}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Pricing</span>
                  <p className="text-gray-900">{extractedData.pricing_model}</p>
                </div>
              </div>

              {extractedData.tags.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-500">Tags</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extractedData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {extractedData.features.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-500">Features</span>
                  <ul className="mt-2 space-y-1">
                    {extractedData.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                leftIcon={<Edit2 className="h-4 w-4" />}
                onClick={() => setStep('url')}
              >
                Edit Information
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                leftIcon={<Send className="h-4 w-4" />}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Submit Tool
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'success' && (
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Tool Submitted Successfully!
          </h1>
          <p className="mt-4 text-gray-600">
            Your tool has been submitted and is pending review. We'll notify you
            once it's approved and live on the marketplace.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            {submittedToolSlug && (
              <Button
                variant="primary"
                onClick={() => router.push(`/tools/${submittedToolSlug}`)}
              >
                View Your Listing
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
