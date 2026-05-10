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

export interface AboutContentData {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  resumeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEntryData {
  _id: string;
  year: string;
  title: string;
  organizationName?: string;
  organizationUrl?: string;
  description: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

interface ArrayResponse<T> {
  success: boolean;
  data: T[];
}

// =============================================================================
// Query Keys
// =============================================================================

export const aboutKeys = {
  all: ["about"] as const,
  content: () => ["about", "content"] as const,
  timeline: () => ["about", "timeline"] as const,
  timelineAdmin: () => ["about", "timeline", "admin"] as const,
};

// =============================================================================
// About Content Hooks
// =============================================================================

/**
 * Fetch the active about content (public)
 */
export function useAboutContent(
  queryOptions?: Partial<UseQueryOptions<AboutContentData | null>>,
) {
  return useQuery<AboutContentData | null>({
    queryKey: aboutKeys.content(),
    queryFn: async () => {
      const response =
        await apiClient.get<SingleResponse<AboutContentData | null>>("/about");
      return response.data.data;
    },
    ...queryOptions,
  });
}

/**
 * Update (upsert) about content — Admin
 */
export function useUpdateAboutContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<AboutContentData>) => {
      const response = await apiClient.put<SingleResponse<AboutContentData>>(
        "/about",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutKeys.all });
    },
  });
}

// =============================================================================
// Timeline Hooks
// =============================================================================

/**
 * Fetch timeline entries
 */
export function useTimeline(
  includeHidden = false,
  queryOptions?: Partial<UseQueryOptions<TimelineEntryData[]>>,
) {
  return useQuery<TimelineEntryData[]>({
    queryKey: includeHidden ? aboutKeys.timelineAdmin() : aboutKeys.timeline(),
    queryFn: async () => {
      const qs = includeHidden ? "?includeHidden=true" : "";
      const response = await apiClient.get<ArrayResponse<TimelineEntryData>>(
        `/about/timeline${qs}`,
      );
      return response.data.data;
    },
    ...queryOptions,
  });
}

/**
 * Create timeline entry — Admin
 */
export function useCreateTimelineEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<TimelineEntryData, "_id" | "createdAt" | "updatedAt">,
    ) => {
      const response = await apiClient.post<SingleResponse<TimelineEntryData>>(
        "/about/timeline",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutKeys.all });
    },
  });
}

/**
 * Update timeline entry — Admin
 */
export function useUpdateTimelineEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TimelineEntryData>;
    }) => {
      const response = await apiClient.patch<SingleResponse<TimelineEntryData>>(
        `/about/timeline/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutKeys.all });
    },
  });
}

/**
 * Delete timeline entry — Admin
 */
export function useDeleteTimelineEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/about/timeline/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutKeys.all });
    },
  });
}
