import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// =============================================================================
// Types
// =============================================================================

export interface BlogPostData {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  readTime: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

// =============================================================================
// Query Keys
// =============================================================================

export const blogKeys = {
  all: ["blog-posts"] as const,
  lists: () => [...blogKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...blogKeys.lists(), params] as const,
  detail: (slug: string) => [...blogKeys.all, "detail", slug] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch public blog posts
 */
export function useBlogPosts(
  options?: { limit?: number; category?: string },
  queryOptions?: Partial<UseQueryOptions<BlogPostData[]>>,
) {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.category) params.set("category", options.category);

  return useQuery<BlogPostData[]>({
    queryKey: blogKeys.list(options ?? {}),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<BlogPostData>>(
        `/blog?${params.toString()}`,
      );
      return response.data.data;
    },
    ...queryOptions,
  });
}

/**
 * Fetch all blog posts (including drafts) for admin
 */
export function useAdminBlogPosts(
  options?: { page?: number; limit?: number },
  queryOptions?: Partial<
    UseQueryOptions<{
      posts: BlogPostData[];
      meta: PaginatedResponse<BlogPostData>["meta"];
    }>
  >,
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  return useQuery({
    queryKey: blogKeys.list({ page, limit, admin: true }),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<BlogPostData>>(
        `/blog?page=${page}&limit=${limit}&includeAll=true`,
      );
      return {
        posts: response.data.data,
        meta: response.data.meta,
      };
    },
    ...queryOptions,
  });
}

/**
 * Fetch a single blog post by slug
 */
export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: async () => {
      const response = await apiClient.get<SingleResponse<BlogPostData>>(
        `/blog/${slug}`,
      );
      return response.data.data;
    },
    enabled: !!slug,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new blog post
 */
export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<BlogPostData, "_id" | "createdAt" | "updatedAt">,
    ) => {
      const response = await apiClient.post<SingleResponse<BlogPostData>>(
        "/blog",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

/**
 * Update a blog post by slug
 */
export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      data,
    }: {
      slug: string;
      data: Partial<BlogPostData>;
    }) => {
      const response = await apiClient.put<SingleResponse<BlogPostData>>(
        `/blog/${slug}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

/**
 * Delete a blog post by slug
 */
export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      await apiClient.delete(`/blog/${slug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}
