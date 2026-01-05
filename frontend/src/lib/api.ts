/**
 * API client for the AI Tool Marketplace
 */
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  Tool,
  ToolListItem,
  Category,
  CategoryWithChildren,
  Review,
  ToolExtractionResult,
  PaginatedResponse,
  BaseResponse,
  TokenResponse,
  User,
  PlatformStats,
  ToolStats,
  ToolCreateRequest,
  ToolSearchParams,
  ReviewCreateRequest,
  RankingType,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  public client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.token = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  // Auth
  async register(email: string, password: string, fullName?: string): Promise<TokenResponse> {
    const { data } = await this.client.post<TokenResponse>('/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const { data } = await this.client.post<TokenResponse>('/auth/login', {
      email,
      password,
    });
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/auth/me');
    return data;
  }

  async deleteAccount(): Promise<BaseResponse> {
    const { data } = await this.client.delete<BaseResponse>('/auth/me');
    this.logout();
    return data;
  }

  async deleteUserByAdmin(userId: string): Promise<BaseResponse> {
    const { data } = await this.client.delete<BaseResponse>(`/auth/users/${userId}`);
    return data;
  }

  // Tools
  async getTools(
    page = 1,
    limit = 20,
    categoryId?: string,
    rankingType: RankingType = 'default'
  ): Promise<PaginatedResponse<ToolListItem>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ranking_type: rankingType,
    });
    if (categoryId) params.append('category_id', categoryId);

    const { data } = await this.client.get<PaginatedResponse<ToolListItem>>(
      `/tools?${params.toString()}`
    );
    return data;
  }

  async searchTools(params: ToolSearchParams): Promise<PaginatedResponse<ToolListItem>> {
    const searchParams = new URLSearchParams({
      q: params.q,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
      search_type: params.search_type || 'hybrid',
    });
    if (params.category_id) searchParams.append('category_id', params.category_id);
    if (params.min_rating) searchParams.append('min_rating', params.min_rating.toString());
    if (params.pricing) {
      params.pricing.forEach((p) => searchParams.append('pricing', p));
    }

    const { data } = await this.client.get<PaginatedResponse<ToolListItem>>(
      `/tools/search?${searchParams.toString()}`
    );
    return data;
  }

  async getTool(id: string): Promise<Tool> {
    const { data } = await this.client.get<Tool>(`/tools/${id}`);
    return data;
  }

  async getToolBySlug(slug: string): Promise<Tool> {
    const { data } = await this.client.get<Tool>(`/tools/slug/${slug}`);
    return data;
  }

  async extractToolFromUrl(url: string): Promise<ToolExtractionResult> {
    const { data } = await this.client.post<ToolExtractionResult>(
      `/tools/extract`,
      { url }
    );
    return data;
  }

  async submitToolFromUrl(url: string): Promise<Tool> {
    const { data } = await this.client.post<Tool>('/tools/submit', { url });
    return data;
  }

  async createTool(toolData: ToolCreateRequest): Promise<Tool> {
    const { data } = await this.client.post<Tool>('/tools', toolData);
    return data;
  }

  async updateTool(id: string, toolData: Partial<ToolCreateRequest>): Promise<Tool> {
    const { data } = await this.client.patch<Tool>(`/tools/${id}`, toolData);
    return data;
  }

  async deleteTool(id: string): Promise<BaseResponse> {
    const { data } = await this.client.delete<BaseResponse>(`/tools/${id}`);
    return data;
  }

  async recordClick(toolId: string, source?: string): Promise<void> {
    await this.client.post(`/tools/${toolId}/click`, null, {
      params: { source },
    });
  }

  // Categories
  async getCategories(featuredOnly = false): Promise<Category[]> {
    const params = new URLSearchParams();
    if (featuredOnly) params.append('featured_only', 'true');

    const { data } = await this.client.get<Category[]>(`/categories?${params.toString()}`);
    return data;
  }

  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    const { data } = await this.client.get<CategoryWithChildren[]>('/categories/tree');
    return data;
  }

  async getCategory(id: string): Promise<Category> {
    const { data } = await this.client.get<Category>(`/categories/${id}`);
    return data;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const { data } = await this.client.get<Category>(`/categories/slug/${slug}`);
    return data;
  }

  async getCategoryTools(
    categoryId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<ToolListItem>> {
    const { data } = await this.client.get<PaginatedResponse<ToolListItem>>(
      `/categories/${categoryId}/tools?page=${page}&limit=${limit}`
    );
    return data;
  }

  async createCategory(categoryData: { name: string; slug: string; description?: string }): Promise<Category> {
    const { data } = await this.client.post<Category>('/categories', categoryData);
    return data;
  }

  async deleteCategory(id: string): Promise<BaseResponse> {
    const { data } = await this.client.delete<BaseResponse>(`/categories/${id}`);
    return data;
  }

  // Reviews
  async createReview(review: ReviewCreateRequest): Promise<Review> {
    const { data } = await this.client.post<Review>('/reviews', review);
    return data;
  }

  async getToolReviews(
    toolId: string,
    page = 1,
    limit = 20,
    sort: 'newest' | 'highest' | 'lowest' | 'helpful' = 'newest'
  ): Promise<PaginatedResponse<Review>> {
    const { data } = await this.client.get<PaginatedResponse<Review>>(
      `/reviews/tool/${toolId}?page=${page}&limit=${limit}&sort=${sort}`
    );
    return data;
  }

  async markReviewHelpful(reviewId: string, helpful: boolean): Promise<void> {
    await this.client.post(`/reviews/${reviewId}/helpful`, { helpful });
  }

  // Saved tools
  async saveTool(toolId: string, collection = 'default', notes?: string): Promise<void> {
    await this.client.post('/reviews/saved', {
      tool_id: toolId,
      collection_name: collection,
      notes,
    });
  }

  async unsaveTool(toolId: string): Promise<void> {
    await this.client.delete(`/reviews/saved/${toolId}`);
  }

  async getSavedTools(collection = 'default'): Promise<{ tool_id: string }[]> {
    const { data } = await this.client.get(`/reviews/saved?collection=${collection}`);
    return data;
  }

  // Admin
  async getPlatformStats(): Promise<PlatformStats> {
    const { data } = await this.client.get<PlatformStats>('/admin/stats');
    return data;
  }

  async getPendingTools(page = 1, limit = 20): Promise<PaginatedResponse<ToolListItem>> {
    const { data } = await this.client.get<PaginatedResponse<ToolListItem>>(
      `/admin/tools/pending?page=${page}&limit=${limit}`
    );
    return data;
  }

  async getAdminTools(
    page = 1,
    limit = 20,
    status?: string,
    search?: string
  ): Promise<PaginatedResponse<ToolListItem>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const { data } = await this.client.get<PaginatedResponse<ToolListItem>>(
      `/admin/tools?${params.toString()}`
    );
    return data;
  }

  async getToolStats(toolId: string): Promise<ToolStats> {
    const { data } = await this.client.get<ToolStats>(`/admin/tools/${toolId}/stats`);
    return data;
  }

  async moderateTool(toolId: string, action: 'approve' | 'reject' | 'archive', reason?: string): Promise<Tool> {
    const { data } = await this.client.post<Tool>(`/tools/${toolId}/moderate`, {
      action,
      reason,
    });
    return data;
  }

  async updateToolRanking(
    toolId: string,
    updates: {
      is_featured?: boolean;
      is_sponsored?: boolean;
      is_trending?: boolean;
      is_editors_pick?: boolean;
      is_internal?: boolean;
      sponsored_rank?: number;
      featured_rank?: number;
    }
  ): Promise<Tool> {
    const { data } = await this.client.patch<Tool>(`/tools/${toolId}/ranking`, updates);
    return data;
  }

  async bulkToolAction(
    toolIds: string[],
    action: 'approve' | 'reject' | 'archive' | 'feature' | 'unfeature'
  ): Promise<BaseResponse> {
    const { data } = await this.client.post<BaseResponse>(
      `/admin/tools/bulk-action?action=${action}`,
      toolIds
    );
    return data;
  }

  async recalculateRankings(toolIds?: string[]): Promise<BaseResponse> {
    const { data } = await this.client.post<BaseResponse>('/admin/ranking/recalculate', toolIds);
    return data;
  }
}

export const api = new ApiClient();
export default api;
