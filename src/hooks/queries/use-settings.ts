import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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
