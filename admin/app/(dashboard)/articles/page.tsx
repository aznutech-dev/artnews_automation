import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { ArticleCard } from "@/lib/types";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (sp.status) params.set("status", sp.status);
  if (sp.source) params.set("source", sp.source);
  if (sp.q) params.set("q", sp.q);
  params.set("limit", "100");

  const articles = await apiFetch<ArticleCard[]>(`/api/admin/articles?${params}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <Link
          href="/articles/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + New article
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3 rounded-md border bg-white px-4 py-3">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search title…"
          className="flex-1 min-w-[200px] rounded-md border px-3 py-1.5 text-sm"
        />
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-md border px-3 py-1.5 text-sm">
          <option value="">Any status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select name="source" defaultValue={sp.source ?? ""} className="rounded-md border px-3 py-1.5 text-sm">
          <option value="">Any source</option>
          <option value="manual">Manual</option>
          <option value="agent">Agent</option>
        </select>
        <button className="rounded-md bg-slate-100 px-4 py-1.5 text-sm hover:bg-slate-200">
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/articles/${a.id}`} className="font-medium hover:underline">
                    {a.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-slate-500">{a.excerpt.slice(0, 80)}</div>
                </td>
                <td className="px-4 py-3">{a.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {a.published_at
                    ? new Date(a.published_at).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  No articles match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
