"use client";

import { useMemo } from "react";
import { analyzeSeo } from "@/lib/seo";

type Props = {
  focusKeyword: string;
  onChangeFocusKeyword: (v: string) => void;
  title: string;
  slug: string;
  metaDescription: string;
  body: string;
};

export default function SeoPanel({
  focusKeyword,
  onChangeFocusKeyword,
  title,
  slug,
  metaDescription,
  body,
}: Props) {
  const result = useMemo(() => {
    return analyzeSeo(focusKeyword, title, slug, metaDescription, body);
  }, [focusKeyword, title, slug, metaDescription, body]);

  const getScoreColor = (score: number) => {
    if (!focusKeyword) return "text-slate-500";
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className="rounded-md border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">SEO Analysis</h3>
        <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
          {focusKeyword ? `${result.score}/100` : "N/A"}
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Focus Keyword
        </label>
        <input
          type="text"
          value={focusKeyword}
          onChange={(e) => onChangeFocusKeyword(e.target.value)}
          placeholder="e.g. latest tech news"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          Set a focus keyword to calculate your SEO score.
        </p>
      </div>

      <div className="space-y-2 text-sm">
        {result.checks.map((check) => (
          <div key={check.id} className="flex items-start gap-2">
            {check.passed ? (
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            )}
            <span className={check.passed ? "text-slate-700" : "text-slate-500"}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
