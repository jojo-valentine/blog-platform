export const permissionsList = [
  // User
  "create_user",
  "view_user",
  "update_user",
  "delete_user",
  "suspend_user",

  // Role
  "create_role",
  "view_role",
  "update_role",
  "delete_role",

  // Blog
  "create_blog",
  "view_blog",
  "update_blog",
  "delete_blog",
  "blog_suspension",
  "blog_publish",

  // Category
  "create_category",
  "view_category",
  "update_category",
  "delete_category",

  // Media
  "upload_media",
  "view_media",
  "delete_media",

  // Comment
  "view_comment",
  "delete_comment",
  "suspend_comment",

  // Dashboard
  "view_dashboard",

  // Settings
  "manage_settings",

  // Analytics
  "view_analytics",
] as const;
