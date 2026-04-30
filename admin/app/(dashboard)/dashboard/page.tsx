import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { ArticleCard } from "@/lib/types";

export default async function DashboardPage() {
  const stats = await apiFetch<Record<string, number>>("/api/admin/articles/_/stats");
  const recent = await apiFetch<ArticleCard[]>("/api/admin/articles?limit=10");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Drafts" value={stats.draft ?? 0} accent="text-amber-700" />
        <Stat label="Published" value={stats.published ?? 0} accent="text-emerald-700" />
        <Stat label="Archived" value={stats.archived ?? 0} accent="text-slate-500" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent</h2>
          <Link href="/articles" className="text-sm text-slate-600 hover:underline">
            All articles →
          </Link>
        </div>
        <ul className="divide-y rounded-md border bg-white">
          {recent.map((a) => (
            <li key={a.id}>
              <Link
                href={`/articles/${a.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-slate-500">
                    {a.category?.name ?? "Uncategorized"} ·{" "}
                    {a.published_at
                      ? new Date(a.published_at).toLocaleDateString()
                      : "Draft"}
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="px-4 py-6 text-center text-slate-500">No articles yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
