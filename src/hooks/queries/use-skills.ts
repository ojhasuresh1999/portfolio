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

export interface SkillData {
  _id: string;
  name: string;
  proficiency: number;
  category: "LANGUAGE" | "DATABASE" | "DEVOPS" | "FRAMEWORK" | "TOOL";
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

export const skillKeys = {
  all: ["skills"] as const,
  admin: () => ["admin-skills"] as const,
  public: (includeHidden: boolean = false) =>
    ["skills", { includeHidden }] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all skills (Public)
 */
export function useSkills(
  includeHidden = false,
  queryOptions?: Partial<UseQueryOptions<SkillData[]>>,
) {
  return useQuery<SkillData[]>({
    queryKey: skillKeys.public(includeHidden),
    queryFn: async () => {
      const qs = includeHidden ? "?includeHidden=true" : "";
      const response = await apiClient.get<ArrayResponse<SkillData>>(
        `/skills${qs}`,
      );
      return response.data.data;
    },
    ...queryOptions,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<SkillData>) => {
      const response = await apiClient.post<SingleResponse<SkillData>>(
        "/skills",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<SkillData>;
    }) => {
      const response = await apiClient.put<SingleResponse<SkillData>>(
        `/skills/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
    },
  });
}
