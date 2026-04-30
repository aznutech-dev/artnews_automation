import { apiFetch } from "@/lib/api";
import type { Article, Category } from "@/lib/types";
import ArticleForm from "@/components/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, categories] = await Promise.all([
    apiFetch<Article>(`/api/admin/articles/${id}`),
    apiFetch<Category[]>("/api/admin/categories"),
  ]);

  const statusBadge =
    article.status === "published"
      ? "bg-emerald-100 text-emerald-800"
      : article.status === "archived"
        ? "bg-slate-200 text-slate-700"
        : "bg-amber-100 text-amber-800";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit article</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-1 font-medium uppercase ${statusBadge}`}>
            {article.status}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 font-medium uppercase text-slate-600">
            {article.source}
          </span>
        </div>
      </div>
      <ArticleForm article={article} categories={categories} />
    </div>
  );
}
