import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const a = await api.getArticle(slug);
    return {
      title: a.meta_title ?? a.title,
      description: a.meta_description ?? a.excerpt,
      alternates: a.canonical_url ? { canonical: a.canonical_url } : undefined,
      openGraph: {
        title: a.meta_title ?? a.title,
        description: a.meta_description ?? a.excerpt,
        images: a.og_image_url
          ? [a.og_image_url]
          : a.featured_image_url
            ? [a.featured_image_url]
            : [],
      },
    };
  } catch {
    return { title: "Not found" };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let article;
  try {
    article = await api.getArticle(slug);
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl">
      {article.category && (
        <span className="text-sm font-semibold uppercase tracking-wider text-red-700">
          {article.category.name}
        </span>
      )}
      <h1 className="mt-2 font-serif text-4xl font-bold leading-tight">
        {article.title}
      </h1>
      <p className="mt-4 text-lg text-gray-600">{article.excerpt}</p>
      <p className="mt-2 text-sm text-gray-400">
        {article.reading_time_minutes} min read
      </p>

      {article.featured_image_url && (
        <img
          src={article.featured_image_url}
          alt={article.featured_image_alt ?? ""}
          className="mt-8 aspect-[16/10] w-full rounded-lg object-cover"
        />
      )}

      <div
        className="prose prose-lg mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />
    </article>
  );
}
