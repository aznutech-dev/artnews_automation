import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "USA Update News",
    template: "%s | USA Update News",
  },
  description: "Latest news and updates from across the USA.",
  metadataBase: new URL("https://usaupdatenews.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <a href="/" className="font-serif text-2xl font-bold tracking-tight">
              USA Update News
            </a>
            <nav className="flex gap-6 text-sm font-medium text-gray-700">
              <a href="/category/politics">Politics</a>
              <a href="/category/business">Business</a>
              <a href="/category/tech">Tech</a>
              <a href="/category/world">World</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t py-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} USA Update News
        </footer>
      </body>
    </html>
  );
}
