import { supabase, mem } from "../db/supabase.js";
import type { FAQ } from "../types/index.js";

// Cache FAQs in memory with a TTL to avoid repeated DB hits
let faqCache: FAQ[] = [];
let cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getFAQs(): Promise<FAQ[]> {
  if (Date.now() - cacheTs < CACHE_TTL && faqCache.length) return faqCache;

  if (supabase) {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("active", true);
    if (error) throw new Error(`getFAQs: ${error.message}`);
    faqCache = data ?? [];
  } else {
    faqCache = mem.faqs.filter((f) => f.active) as FAQ[];
  }

  cacheTs = Date.now();
  return faqCache;
}

export function invalidateFAQCache() {
  cacheTs = 0;
}

// Keyword + tag matching (v1). Upgrade to pgvector embeddings in v2.
export async function matchFAQ(
  query: string
): Promise<{ faq: FAQ | null; confidence: number }> {
  const faqs = await getFAQs();
  const q = query.toLowerCase().replace(/[^\w\s]/g, "");
  const qWords = new Set(q.split(/\s+/).filter((w) => w.length > 3));

  let best: FAQ | null = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const haystack = (faq.question + " " + faq.tags.join(" "))
      .toLowerCase()
      .replace(/[^\w\s]/g, "");
    const hWords = new Set(haystack.split(/\s+/).filter((w) => w.length > 3));

    let overlap = 0;
    for (const w of qWords) {
      if (hWords.has(w)) overlap++;
    }

    const tagBoost = faq.tags.some((t) => q.includes(t.toLowerCase())) ? 0.2 : 0;
    const score = overlap / Math.max(qWords.size, hWords.size) + tagBoost;

    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }

  const FAQ_THRESHOLD = 0.35;
  return {
    faq: bestScore >= FAQ_THRESHOLD ? best : null,
    confidence: Math.min(bestScore, 1),
  };
}
