/**
 * TypeScript types for the AI Tool Marketplace
 */

// Enums
export type ToolStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type PricingModel = 'free' | 'freemium' | 'paid' | 'subscription' | 'usage_based' | 'contact' | 'open_source';
export type UserRole = 'user' | 'creator' | 'admin' | 'super_admin';
export type RankingType = 'default' | 'sponsored' | 'featured' | 'trending' | 'newest' | 'top_rated';
export type SearchType = 'keyword' | 'semantic' | 'hybrid';

// User
export interface User {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

// Tool
export interface Tool {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  long_description?: string;
  tagline?: string;
  website_url: string;
  logo_url?: string;
  screenshot_url?: string;
  demo_url?: string;
  docs_url?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  discord_url?: string;
  youtube_url?: string;
  category_id?: string;
  tags: string[];
  use_cases: string[];
  pricing_model: PricingModel;
  pricing_details?: string;
  starting_price?: number;
  status: ToolStatus;
  is_featured: boolean;
  is_sponsored: boolean;
  is_trending: boolean;
  is_editors_pick: boolean;
  is_verified: boolean;
  view_count: number;
  click_count: number;
  save_count: number;
  review_count: number;
  average_rating: number;
  rank_score: number;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ToolListItem {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  logo_url?: string;
  category_id?: string;
  pricing_model: PricingModel;
  starting_price?: number;
  tags: string[];
  is_featured: boolean;
  is_sponsored: boolean;
  is_trending: boolean;
  average_rating: number;
  review_count: number;
  rank_score: number;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  tool_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

// Review
export interface Review {
  id: string;
  tool_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content?: string;
  ease_of_use?: number;
  value_for_money?: number;
  features?: number;
  support?: number;
  helpful_count: number;
  not_helpful_count: number;
  is_verified_purchase: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

// Extraction
export interface ToolExtractionResult {
  name: string;
  short_description: string;
  long_description?: string;
  category: string;
  tags: string[];
  pricing_model: string;
  pricing_details?: string;
  logo_url?: string;
  github_url?: string;
  twitter_url?: string;
  features: string[];
  use_cases: string[];
  raw_data: Record<string, unknown>;
}

// API Responses
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  detail?: string;
  code?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// Analytics
export interface PlatformStats {
  total_tools: number;
  total_users: number;
  total_categories: number;
  total_reviews: number;
  tools_pending: number;
  tools_approved: number;
  total_views_today: number;
  total_clicks_today: number;
  total_saves_today: number;
  total_searches_today: number;
  revenue_today: number;
  revenue_month: number;
}

export interface ToolStats {
  tool_id: string;
  tool_name: string;
  views_total: number;
  views_today: number;
  views_week: number;
  clicks_total: number;
  clicks_today: number;
  click_through_rate: number;
  saves_total: number;
  reviews_total: number;
  average_rating: number;
  rank_position: number;
  trending_score: number;
}

// Request types
export interface ToolCreateRequest {
  name: string;
  short_description: string;
  long_description?: string;
  tagline?: string;
  website_url: string;
  category_id: string;
  tags: string[];
  use_cases: string[];
  pricing_model: PricingModel;
  pricing_details?: string;
  starting_price?: number;
  logo_url?: string;
  screenshot_url?: string;
  demo_url?: string;
  docs_url?: string;
  github_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  discord_url?: string;
  youtube_url?: string;
}

export interface ToolSearchParams {
  q: string;
  page?: number;
  limit?: number;
  category_id?: string;
  pricing?: PricingModel[];
  min_rating?: number;
  search_type?: SearchType;
}

export interface ReviewCreateRequest {
  tool_id: string;
  rating: number;
  title?: string;
  content?: string;
  ease_of_use?: number;
  value_for_money?: number;
  features?: number;
  support?: number;
}
