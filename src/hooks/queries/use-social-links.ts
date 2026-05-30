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

export interface SocialLinkRecord {
  _id?: string;
  platform: string;
  url: string;
  icon: string;
  isVisible?: boolean;
  order?: number;
}

interface ArrayResponse<T> {
  success: boolean;
  data: T[];
}

// =============================================================================
// Query Keys
// =============================================================================

export const socialLinksKeys = {
  all: ["social-links"] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

export function useSocialLinks(
  queryOptions?: Partial<UseQueryOptions<SocialLinkRecord[]>>,
) {
  return useQuery<SocialLinkRecord[]>({
    queryKey: socialLinksKeys.all,
    queryFn: async () => {
      const response =
        await apiClient.get<ArrayResponse<SocialLinkRecord>>("/social-links");
      return response.data.data;
    },
    ...queryOptions,
  });
}

export function useUpdateSocialLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SocialLinkRecord>[]) => {
      const response = await apiClient.put<{
        success: boolean;
        data: SocialLinkRecord[];
      }>("/social-links", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialLinksKeys.all });
    },
  });
}
