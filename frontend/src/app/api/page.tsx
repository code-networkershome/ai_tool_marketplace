import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation - AI_for_X',
  description: 'API documentation for integrating with AI_for_X marketplace.',
};

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/tools',
    description: 'Get all tools with pagination and filtering',
    parameters: ['page', 'limit', 'category_id', 'ranking_type'],
  },
  {
    method: 'GET',
    path: '/api/v1/tools/{id}',
    description: 'Get a specific tool by ID',
    parameters: [],
  },
  {
    method: 'GET',
    path: '/api/v1/tools/search',
    description: 'Search tools with advanced filters',
    parameters: ['q', 'page', 'limit', 'category_id', 'pricing'],
  },
  {
    method: 'POST',
    path: '/api/v1/tools',
    description: 'Create a new tool (requires auth)',
    parameters: ['name', 'description', 'url', 'category_id'],
  },
  {
    method: 'GET',
    path: '/api/v1/categories',
    description: 'Get all categories',
    parameters: ['featured_only'],
  },
  {
    method: 'POST',
    path: '/api/v1/auth/register',
    description: 'Register a new user',
    parameters: ['email', 'password', 'full_name'],
  },
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    description: 'Login and get access token',
    parameters: ['email', 'password'],
  },
  {
    method: 'GET',
    path: '/api/v1/reviews',
    description: 'Get reviews for a tool',
    parameters: ['tool_id', 'page', 'limit'],
  },
];

export default function ApiPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white">API Documentation</h1>
          <p className="mt-4 text-xl text-gray-300">
            Integrate AI_for_X into your applications with our REST API
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* API Key Section */}
        <div className="mb-12 rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-900">Getting Started</h2>
          <p className="mt-2 text-gray-600">
            To use the API, you'll need an API key. Generate one from your account settings.
          </p>
          <div className="mt-4 rounded bg-gray-900 p-4">
            <p className="text-sm text-gray-300">
              <span className="text-green-400">Authorization:</span> Bearer YOUR_API_KEY
            </p>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg bg-white shadow-md"
            >
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-3">
                <span
                  className={`rounded px-2 py-1 text-xs font-bold ${
                    endpoint.method === 'GET'
                      ? 'bg-green-100 text-green-700'
                      : endpoint.method === 'POST'
                      ? 'bg-blue-100 text-blue-700'
                      : endpoint.method === 'PUT'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {endpoint.method}
                </span>
                <code className="text-sm text-gray-700">{endpoint.path}</code>
              </div>
              <div className="p-4">
                <p className="text-gray-600">{endpoint.description}</p>
                {endpoint.parameters.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-500">Parameters:</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {endpoint.parameters.map((param) => (
                        <span
                          key={param}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {param}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Rate Limiting */}
        <div className="mt-12 rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-900">Rate Limiting</h2>
          <p className="mt-2 text-gray-600">
            API requests are limited to 100 requests per minute per IP address.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Rate limit headers are included in all responses.
          </p>
        </div>

        {/* Support */}
        <div className="mt-12 rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-gray-900">Support</h2>
          <p className="mt-2 text-gray-600">
            Need help with the API? Contact us at{' '}
            <a href="mailto:api@ai_for_x.com" className="text-primary-600 hover:underline">
              api@ai_for_x.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
