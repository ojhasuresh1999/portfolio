// =============================================================================
// Custom TanStack Query Hooks — Barrel Export
// =============================================================================

// Projects
export {
  useProjects,
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

// Settings & Social Links
export {
  useSettings,
  useUpdateSettings,
  settingsKeys,
  useSocialLinks,
  useUpdateSocialLinks,
  socialLinksKeys,
} from "./use-settings";
