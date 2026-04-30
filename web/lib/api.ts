const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  category: Category | null;
  is_featured: boolean;
  is_breaking: boolean;
  published_at: string | null;
  reading_time_minutes: number;
};

export type Article = ArticleCard & {
  body: string;
  tags: Tag[];
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  view_count: number;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  return res.json();
}

export const api = {
  listArticles: (params: {
    categorySlug?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.categorySlug) q.set("category_slug", params.categorySlug);
    if (params.featured !== undefined) q.set("featured", String(params.featured));
    if (params.limit) q.set("limit", String(params.limit));
    if (params.offset) q.set("offset", String(params.offset));
    return apiFetch<ArticleCard[]>(`/api/articles?${q.toString()}`);
  },
  getArticle: (slug: string) => apiFetch<Article>(`/api/articles/${slug}`),
  listCategories: () => apiFetch<Category[]>("/api/categories"),
};
