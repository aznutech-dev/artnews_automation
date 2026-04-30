import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { ApiKey, ApiKeyCreatedOnce } from "@/lib/types";

async function createKeyAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const created = await apiFetch<ApiKeyCreatedOnce>("/api/admin/api-keys", {
    method: "POST",
    body: JSON.stringify({
      name,
      scopes: String(formData.get("scopes") ?? "articles:write")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }),
  });
  redirect(`/api-keys?new=${encodeURIComponent(created.raw_key)}&name=${encodeURIComponent(name)}`);
}

async function revokeKeyAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await apiFetch(`/api/admin/api-keys/${id}/revoke`, { method: "POST" });
  revalidatePath("/api-keys");
}

async function deleteKeyAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apiFetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
  revalidatePath("/api-keys");
}

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; name?: string }>;
}) {
  const sp = await searchParams;
  const keys = await apiFetch<ApiKey[]>("/api/admin/api-keys");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">API Keys</h1>

      {sp.new && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4">
          <div className="font-medium text-emerald-900">
            New key for &quot;{sp.name}&quot; — copy now, you will not see it again:
          </div>
          <code className="mt-2 block break-all rounded bg-white px-3 py-2 font-mono text-sm">
            {sp.new}
          </code>
        </div>
      )}

      <form action={createKeyAction} className="grid grid-cols-3 gap-3 rounded-md border bg-white p-4">
        <input name="name" required placeholder="Key name (e.g. local-agent)" className="rounded-md border px-3 py-2 text-sm" />
        <input
          name="scopes"
          defaultValue="articles:write"
          placeholder="Scopes (comma-separated)"
          className="rounded-md border px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Create key
        </button>
      </form>

      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Prefix</th>
              <th className="px-4 py-2">Scopes</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Last used</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {keys.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-3 font-medium">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{k.key_prefix}…</td>
                <td className="px-4 py-3 text-xs">{k.scopes.join(", ")}</td>
                <td className="px-4 py-3">
                  {k.is_active ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      active
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                      revoked
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "—"}
                </td>
                <td className="space-x-3 px-4 py-3 text-right text-xs">
                  {k.is_active && (
                    <form action={revokeKeyAction} className="inline">
                      <input type="hidden" name="id" value={k.id} />
                      <button className="text-amber-700 hover:underline">Revoke</button>
                    </form>
                  )}
                  <form action={deleteKeyAction} className="inline">
                    <input type="hidden" name="id" value={k.id} />
                    <button className="text-red-700 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No API keys yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
