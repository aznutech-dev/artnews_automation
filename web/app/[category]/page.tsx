import { notFound } from "next/navigation";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const [categories, articles] = await Promise.all([
    api.listCategories().catch(() => []),
    api.listArticles({ categorySlug: slug, limit: 30 }).catch(() => []),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const categoryName = category.name;

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl font-bold">{categoryName}</h1>

      {articles.length === 0 ? (
        <p className="py-16 text-center text-gray-500">
          No published articles in this category yet.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <a key={a.id} href={`/news/${a.slug}`} className="group">
              {a.featured_image_url ? (
                <img
                  src={a.featured_image_url}
                  alt={a.featured_image_alt ?? ""}
                  className="aspect-[16/10] w-full rounded-md object-cover"
                />
              ) : (
                <div className="aspect-[16/10] w-full rounded-md bg-gray-100" />
              )}
              <h3 className="mt-3 font-serif text-xl font-semibold leading-snug group-hover:underline">
                {a.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{a.excerpt}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
