export type SeoScore = {
  score: number;
  checks: {
    id: string;
    label: string;
    passed: boolean;
    importance: "high" | "medium" | "low";
  }[];
};

export function analyzeSeo(
  focusKeyword: string,
  title: string,
  slug: string,
  metaDescription: string,
  bodyHtml: string
): SeoScore {
  const keyword = focusKeyword.trim().toLowerCase();
  
  // Basic checks if no keyword is provided
  if (!keyword) {
    return {
      score: 0,
      checks: [
        { id: "no-keyword", label: "Focus keyword is missing", passed: false, importance: "high" },
        { id: "title-len", label: "Title length is good (50-60 chars)", passed: title.length >= 50 && title.length <= 60, importance: "medium" },
        { id: "meta-len", label: "Meta description is good (150-160 chars)", passed: metaDescription.length >= 150 && metaDescription.length <= 160, importance: "medium" },
      ],
    };
  }

  const checks: SeoScore["checks"] = [];
  let score = 0;
  let maxScore = 0;

  function addCheck(id: string, label: string, passed: boolean, importance: "high" | "medium" | "low") {
    checks.push({ id, label, passed, importance });
    const weight = importance === "high" ? 3 : importance === "medium" ? 2 : 1;
    maxScore += weight;
    if (passed) score += weight;
  }

  // 1. Title Checks
  addCheck("title-len", "Title length is optimal (50-60 chars)", title.length >= 50 && title.length <= 60, "medium");
  addCheck("title-keyword", "Focus keyword is in the title", title.toLowerCase().includes(keyword), "high");
  addCheck("title-start", "Focus keyword is at the beginning of the title", title.toLowerCase().startsWith(keyword), "medium");

  // 2. Meta Description Checks
  addCheck("meta-len", "Meta description length is optimal (150-160 chars)", metaDescription.length >= 150 && metaDescription.length <= 160, "medium");
  addCheck("meta-keyword", "Focus keyword is in the meta description", metaDescription.toLowerCase().includes(keyword), "high");

  // 3. Slug Check
  addCheck("slug-keyword", "Focus keyword is in the URL slug", slug.toLowerCase().includes(keyword.replace(/\s+/g, "-")), "high");

  // 4. Content Parsing (Rough HTML stripping for analysis)
  const textContent = bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const wordCount = textContent.split(" ").filter(w => w.length > 0).length;
  
  // Word Count
  addCheck("word-count", `Word count is at least 300 words (${wordCount} words)`, wordCount >= 300, "high");

  // Keyword Density
  const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  const keywordCount = (textContent.match(keywordRegex) || []).length;
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
  addCheck(
    "density", 
    `Keyword density is between 1% and 2.5% (current: ${density.toFixed(1)}%)`, 
    density >= 1 && density <= 2.5, 
    "high"
  );

  // First 10% of content check
  const first10PercentWords = textContent.split(" ").slice(0, Math.max(10, Math.floor(wordCount * 0.1))).join(" ");
  addCheck("first-10-percent", "Focus keyword appears in the first 10% of the content", first10PercentWords.includes(keyword), "high");

  // 5. HTML Element Checks
  // H2/H3 Check
  const headings = bodyHtml.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  const headingHasKeyword = headings.some(h => h.toLowerCase().includes(keyword));
  addCheck("heading-keyword", "Focus keyword found in H2 or H3 subheadings", headingHasKeyword, "medium");

  // Image Alt Check
  const images = bodyHtml.match(/<img[^>]+>/gi) || [];
  const imageHasAlt = images.length === 0 || images.every(img => /alt="[^"]+"/i.test(img));
  const imageAltHasKeyword = images.some(img => {
    const match = img.match(/alt="([^"]+)"/i);
    return match && match[1].toLowerCase().includes(keyword);
  });
  addCheck("image-alt", "All images have alt attributes", imageHasAlt, "medium");
  addCheck("image-alt-keyword", "Focus keyword found in image alt attributes", imageAltHasKeyword || images.length === 0, "low");

  // Link Check
  const links = bodyHtml.match(/<a[^>]+href="([^"]+)"[^>]*>/gi) || [];
  const hasExternalLink = links.some(l => {
    const match = l.match(/href="([^"]+)"/i);
    return match && match[1].startsWith("http") && !match[1].includes("usaupdatenews.com");
  });
  const hasInternalLink = links.some(l => {
    const match = l.match(/href="([^"]+)"/i);
    return match && (match[1].startsWith("/") || match[1].includes("usaupdatenews.com"));
  });
  
  addCheck("external-links", "Article has at least one external link", hasExternalLink, "medium");
  addCheck("internal-links", "Article has at least one internal link", hasInternalLink, "medium");

  const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return {
    score: finalScore,
    checks,
  };
}
