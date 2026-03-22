import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ISocialLink } from "@/models";
import { ISiteSettings } from "@/models";

// =============================================================================
// Settings
// =============================================================================

export const settingsKeys = {
  all: ["settings"] as const,
};

export function useSettings() {
  return useQuery<ISiteSettings>({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: ISiteSettings;
      }>("/settings");
      return response.data.data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ISiteSettings>) => {
      const response = await apiClient.put<{
        success: boolean;
        data: ISiteSettings;
      }>("/settings", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// =============================================================================
// Social Links
// =============================================================================

export const socialLinksKeys = {
  all: ["social-links"] as const,
};

export function useSocialLinks() {
  return useQuery<ISocialLink[]>({
    queryKey: socialLinksKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean;
        data: ISocialLink[];
      }>("/social-links");
      return response.data.data;
    },
    initialData: [],
  });
}

export function useUpdateSocialLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ISocialLink>[]) => {
      const response = await apiClient.put<{
        success: boolean;
        data: ISocialLink[];
      }>("/social-links", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialLinksKeys.all });
    },
  });
}
