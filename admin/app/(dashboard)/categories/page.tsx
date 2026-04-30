import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/lib/types";

async function createCategoryAction(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await apiFetch("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify({
      name,
      slug: String(formData.get("slug") ?? "") || undefined,
      description: String(formData.get("description") ?? "") || undefined,
      sort_order: Number(formData.get("sort_order") ?? 0),
    }),
  });
  revalidatePath("/categories");
}

async function deleteCategoryAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
  revalidatePath("/categories");
}

export default async function CategoriesPage() {
  const cats = await apiFetch<Category[]>("/api/admin/categories");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Categories</h1>

      <form action={createCategoryAction} className="grid grid-cols-4 gap-3 rounded-md border bg-white p-4">
        <input name="name" required placeholder="Name" className="rounded-md border px-3 py-2 text-sm" />
        <input name="slug" placeholder="slug (optional)" className="rounded-md border px-3 py-2 font-mono text-sm" />
        <input name="description" placeholder="Description" className="rounded-md border px-3 py-2 text-sm" />
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Add
        </button>
      </form>

      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cats.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.slug}</td>
                <td className="px-4 py-3 text-slate-600">{c.description ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-xs text-red-700 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
            {cats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
