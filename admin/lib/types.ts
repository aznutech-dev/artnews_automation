export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
};

export type Tag = { id: string; name: string; slug: string };

export type ArticleStatus = "draft" | "published" | "archived";
export type ArticleSource = "manual" | "agent";

export type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  category: Category | null;
  status: ArticleStatus;
  is_featured: boolean;
  is_breaking: boolean;
  published_at: string | null;
  reading_time_minutes: number;
};

export type Article = ArticleCard & {
  body: string;
  tags: Tag[];
  source: ArticleSource;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type ApiKeyCreatedOnce = ApiKey & { raw_key: string };

export type Me = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "editor";
  is_active: boolean;
};
