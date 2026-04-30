import { apiFetch } from "@/lib/api";
import type { Category } from "@/lib/types";
import ArticleForm from "@/components/ArticleForm";

export default async function NewArticlePage() {
  const categories = await apiFetch<Category[]>("/api/admin/categories");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New article</h1>
      <ArticleForm categories={categories} />
    </div>
  );
}
