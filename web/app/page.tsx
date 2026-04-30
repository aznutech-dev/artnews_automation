import { api } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  let articles: Awaited<ReturnType<typeof api.listArticles>> = [];
  try {
    articles = await api.listArticles({ limit: 12 });
  } catch {
    articles = [];
  }

  const [hero, ...rest] = articles;

  return (
    <div className="space-y-12">
      {hero && (
        <a href={`/article/${hero.slug}`} className="block group">
          <article className="grid gap-6 md:grid-cols-2">
            {hero.featured_image_url ? (
              <img
                src={hero.featured_image_url}
                alt={hero.featured_image_alt ?? ""}
                className="aspect-[16/10] w-full rounded-lg object-cover"
              />
            ) : (
              <div className="aspect-[16/10] w-full rounded-lg bg-gray-100" />
            )}
            <div className="flex flex-col justify-center">
              {hero.category && (
                <span className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-700">
                  {hero.category.name}
                </span>
              )}
              <h1 className="font-serif text-4xl font-bold leading-tight group-hover:underline">
                {hero.title}
              </h1>
              <p className="mt-4 text-gray-600">{hero.excerpt}</p>
              <p className="mt-4 text-sm text-gray-400">
                {hero.reading_time_minutes} min read
              </p>
            </div>
          </article>
        </a>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="mb-6 font-serif text-2xl font-semibold">Latest stories</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <a key={a.id} href={`/article/${a.slug}`} className="group">
                {a.featured_image_url ? (
                  <img
                    src={a.featured_image_url}
                    alt={a.featured_image_alt ?? ""}
                    className="aspect-[16/10] w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="aspect-[16/10] w-full rounded-md bg-gray-100" />
                )}
                {a.category && (
                  <span className="mt-3 block text-xs font-semibold uppercase tracking-wider text-red-700">
                    {a.category.name}
                  </span>
                )}
                <h3 className="mt-1 font-serif text-xl font-semibold leading-snug group-hover:underline">
                  {a.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{a.excerpt}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {articles.length === 0 && (
        <p className="py-16 text-center text-gray-500">
          No articles published yet.
        </p>
      )}
    </div>
  );
}
