"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Editor from "./Editor";
import SeoPanel from "./SeoPanel";
import type { Article, Category } from "@/lib/types";

type Props = {
  article?: Article;
  categories: Category[];
};

async function callApi(path: string, init: RequestInit) {
  const res = await fetch(`/api/proxy${path}`, init);
  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))).detail ?? res.statusText;
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export default function ArticleForm({ article, categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [categoryId, setCategoryId] = useState(article?.category?.id ?? "");
  const [tags, setTags] = useState((article?.tags ?? []).map((t) => t.name).join(", "));
  const [featuredImageUrl, setFeaturedImageUrl] = useState(article?.featured_image_url ?? "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(article?.featured_image_alt ?? "");
  const [isFeatured, setIsFeatured] = useState(article?.is_featured ?? false);
  const [isBreaking, setIsBreaking] = useState(article?.is_breaking ?? false);
  const [metaTitle, setMetaTitle] = useState(article?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(article?.meta_description ?? "");

  function build(): Record<string, unknown> {
    return {
      title,
      slug: slug || undefined,
      excerpt,
      body,
      category_id: categoryId || null,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      featured_image_url: featuredImageUrl || null,
      featured_image_alt: featuredImageAlt || null,
      is_featured: isFeatured,
      is_breaking: isBreaking,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
    };
  }

  function save(action: "save" | "publish" | "unpublish" | "delete") {
    setError(null);
    startTransition(async () => {
      try {
        if (article) {
          if (action === "delete") {
            if (!confirm("Delete this article? This cannot be undone.")) return;
            await callApi(`/admin/articles/${article.id}`, { method: "DELETE" });
            router.push("/articles");
            return;
          }
          await callApi(`/admin/articles/${article.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(build()),
          });
          if (action === "publish") {
            await callApi(`/admin/articles/${article.id}/publish`, { method: "POST" });
          }
          if (action === "unpublish") {
            await callApi(`/admin/articles/${article.id}/unpublish`, { method: "POST" });
          }
          router.refresh();
        } else {
          const created = await callApi("/admin/articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(build()),
          });
          if (action === "publish") {
            await callApi(`/admin/articles/${created.id}/publish`, { method: "POST" });
          }
          router.push(`/articles/${created.id}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const out = await callApi("/media/upload", { method: "POST", body: fd });
      setFeaturedImageUrl(out.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-lg"
          placeholder="Article headline"
        />
      </Field>

      <Field label="Slug (optional, auto-generated)">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border px-3 py-2 font-mono text-sm"
        />
      </Field>

      <Field label="Excerpt">
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-md border px-3 py-2"
        />
      </Field>

      <Field label="Body">
        <Editor value={body} onChange={setBody} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tags (comma-separated)">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </Field>
      </div>

      <Field label="Featured image">
        <div className="flex items-center gap-3">
          <input
            value={featuredImageUrl}
            onChange={(e) => setFeaturedImageUrl(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            placeholder="URL or upload below"
          />
          <input type="file" accept="image/*" onChange={uploadImage} className="text-sm" />
        </div>
        {featuredImageUrl && (
          <img
            src={featuredImageUrl}
            alt=""
            className="mt-2 h-32 rounded-md border object-cover"
          />
        )}
      </Field>

      <Field label="Image alt text">
        <input
          value={featuredImageAlt}
          onChange={(e) => setFeaturedImageAlt(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
        />
      </Field>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured (homepage hero)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isBreaking} onChange={(e) => setIsBreaking(e.target.checked)} />
          Breaking news
        </label>
      </div>

      <details className="rounded-md border bg-white px-4 py-3">
        <summary className="cursor-pointer font-medium">SEO overrides</summary>
        <div className="mt-4 space-y-3">
          <Field label="Meta title">
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </Field>
          <Field label="Meta description">
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border px-3 py-2"
            />
          </Field>
        </div>
      </details>

      <SeoPanel 
        focusKeyword={focusKeyword} 
        onChangeFocusKeyword={setFocusKeyword} 
        title={title} 
        slug={slug} 
        metaDescription={metaDescription || excerpt} 
        body={body} 
      />

      <div className="sticky bottom-0 -mx-8 flex items-center justify-end gap-3 border-t bg-white px-8 py-3">
        {article && (
          <button
            disabled={pending}
            onClick={() => save("delete")}
            className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        )}
        {article?.status === "published" && (
          <button
            disabled={pending}
            onClick={() => save("unpublish")}
            className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Unpublish
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => save("save")}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          {pending ? "Saving…" : article?.status === "published" ? "Save changes" : "Save draft"}
        </button>
        {article?.status !== "published" && (
          <button
            disabled={pending}
            onClick={() => save("publish")}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Publish
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
