// =============================================================================
// Custom TanStack Query Hooks — Barrel Export
// =============================================================================

// Projects
export {
  useProjects,
  useInfiniteProjects,
  useProject,
  useAdminProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  projectKeys,
  type ProjectData,
} from "./use-projects";

// Blog
export {
  useBlogPosts,
  useInfiniteBlogPosts,
  useAdminBlogPosts,
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  blogKeys,
  type BlogPostData,
} from "./use-blog";

// Chat
export * from "./use-chat";
export * from "./use-skills";
export * from "./use-tech-stack";

// Settings
export { useSettings, useUpdateSettings, settingsKeys } from "./use-settings";

// Social Links
export {
  useSocialLinks,
  useUpdateSocialLinks,
  socialLinksKeys,
} from "./use-social-links";
