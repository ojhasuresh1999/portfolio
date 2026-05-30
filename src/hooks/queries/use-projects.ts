import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// =============================================================================
// Types
// =============================================================================

export interface ProjectData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  image?: string;
  images?: string[];
  codeSnippet?: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  accentColor?: "primary" | "secondary";
  status?: "ongoing" | "completed" | "on-hold" | "archived";
  order: number;
  isFeatured: boolean;
  isVisible: boolean;
  isSourceCodeVisible: boolean;
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

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...projectKeys.lists(), params] as const,
  infinite: (params: Record<string, unknown>) =>
    [...projectKeys.all, "infinite", params] as const,
  admin: () => ["admin-projects"] as const,
  adminList: (page: number, limit: number) =>
    [...projectKeys.admin(), { page, limit }] as const,
  detail: (slug: string) => [...projectKeys.all, "detail", slug] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch public projects (e.g. homepage featured section)
 */
export function useProjects(
  options?: { limit?: number; featured?: boolean },
  queryOptions?: Partial<UseQueryOptions<ProjectData[]>>,
) {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.featured !== undefined)
    params.set("featured", String(options.featured));

  return useQuery<ProjectData[]>({
    queryKey: projectKeys.list(options ?? {}),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: ProjectData[];
      }>(`/projects?${params.toString()}`);
      return response.data.data;
    },
    ...queryOptions,
  });
}

/**
 * Infinite scroll for public projects page
 */
export function useInfiniteProjects(options?: {
  limit?: number;
  featured?: boolean;
}) {
  const limit = options?.limit ?? 6;

  return useInfiniteQuery<PaginatedResponse<ProjectData>, Error>({
    queryKey: projectKeys.infinite(options ?? {}),
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (options?.featured !== undefined)
        params.set("featured", String(options.featured));

      const response = await apiClient.get<PaginatedResponse<ProjectData>>(
        `/projects?${params.toString()}`,
      );
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
  });
}

/**
 * Fetch paginated projects for admin (includes hidden)
 */
export function useAdminProjects(page: number = 1, limit: number = 10) {
  return useQuery<PaginatedResponse<ProjectData>>({
    queryKey: projectKeys.adminList(page, limit),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<ProjectData>>(
        `/projects?page=${page}&limit=${limit}&includeHidden=true`,
      );
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch a single project by slug (for edit form)
 */
export function useProject(slug: string | null) {
  return useQuery<ProjectData>({
    queryKey: projectKeys.detail(slug ?? ""),
    queryFn: async () => {
      const response = await apiClient.get<SingleResponse<ProjectData>>(
        `/projects/${slug}`,
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
 * Create a new project (FormData for image upload)
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post<SingleResponse<ProjectData>>(
        "/projects",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.admin() });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Update a project by slug
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slug,
      data,
    }: {
      slug: string;
      data: Partial<ProjectData>;
    }) => {
      const response = await apiClient.put<SingleResponse<ProjectData>>(
        `/projects/${slug}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.admin() });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Delete a project by slug
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      await apiClient.delete(`/projects/${slug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.admin() });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
