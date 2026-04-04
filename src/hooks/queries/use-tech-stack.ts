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

export interface TechStackData {
  _id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ArrayResponse<T> {
  success: boolean;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

// =============================================================================
// Query Keys
// =============================================================================

export const techStackKeys = {
  all: ["tech-stack"] as const,
  admin: () => ["admin-tech-stack"] as const,
  public: (includeHidden: boolean = false) =>
    ["tech-stack", { includeHidden }] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all tech stack (Public)
 */
export function useTechStack(
  includeHidden = false,
  queryOptions?: Partial<UseQueryOptions<TechStackData[]>>,
) {
  return useQuery<TechStackData[]>({
    queryKey: techStackKeys.public(includeHidden),
    queryFn: async () => {
      const qs = includeHidden ? "?includeHidden=true" : "";
      const response = await apiClient.get<ArrayResponse<TechStackData>>(
        `/tech-stack${qs}`,
      );
      return response.data.data;
    },
    ...queryOptions,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

export function useCreateTechStack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TechStackData>) => {
      const response = await apiClient.post<SingleResponse<TechStackData>>(
        "/tech-stack",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: techStackKeys.all });
    },
  });
}

export function useUpdateTechStack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TechStackData>;
    }) => {
      const response = await apiClient.put<SingleResponse<TechStackData>>(
        `/tech-stack/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: techStackKeys.all });
    },
  });
}

export function useDeleteTechStack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tech-stack/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: techStackKeys.all });
    },
  });
}
