import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase, mem } from "../db/supabase.js";
import type { FAQ } from "../types/index.js";
import { logger } from "../middleware/logger.js";

// ── Embedding client (text-embedding-004 — separate quota from chat models) ──
let embedGenAI: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  embedGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// ── In-memory vector store: faqId → embedding vector ─────────────────────────
const embeddingCache = new Map<string, number[]>();

async function getEmbedding(text: string): Promise<number[] | null> {
  if (!embedGenAI) return null;
  try {
    const model = embedGenAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    logger.warn({ err }, "Embedding generation failed — falling back to keyword match");
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    magA  += a[i] * a[i];
    magB  += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── FAQ cache with 5-min TTL ──────────────────────────────────────────────────
let faqCache: FAQ[] = [];
let cacheTs = 0;
const CACHE_TTL = 5 * 60 * 1000;

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

  // Pre-generate embeddings for any FAQ not yet in the vector store
  // Runs in parallel with a small concurrency cap to avoid quota burst
  const missing = faqCache.filter((f) => !embeddingCache.has(f.id));
  if (missing.length > 0) {
    logger.info({ count: missing.length }, "Generating FAQ embeddings (RAG setup)");
    const BATCH = 5;
    for (let i = 0; i < missing.length; i += BATCH) {
      await Promise.all(
        missing.slice(i, i + BATCH).map(async (faq) => {
          const text = `${faq.question} ${faq.tags.join(" ")}`;
          const vec = await getEmbedding(text);
          if (vec) embeddingCache.set(faq.id, vec);
        })
      );
    }
    logger.info({ embedded: embeddingCache.size }, "FAQ embeddings ready");
  }

  return faqCache;
}

export function invalidateFAQCache() {
  cacheTs = 0;
  embeddingCache.clear();
}

// ── Main FAQ matcher — vector search with keyword fallback ────────────────────
export async function matchFAQ(
  query: string
): Promise<{ faq: FAQ | null; confidence: number }> {
  const faqs = await getFAQs();

  // ── Approach B: Semantic vector search ──────────────────────────────────────
  const queryVec = await getEmbedding(query);
  if (queryVec && embeddingCache.size > 0) {
    let best: FAQ | null = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const faqVec = embeddingCache.get(faq.id);
      if (!faqVec) continue;
      const score = cosineSimilarity(queryVec, faqVec);
      if (score > bestScore) {
        bestScore = score;
        best = faq;
      }
    }

    // Cosine similarity: 0.80+ = strong match, 0.65+ = partial match
    const VECTOR_THRESHOLD = 0.65;
    if (bestScore >= VECTOR_THRESHOLD) {
      logger.info(
        { faqId: best?.id, score: bestScore.toFixed(3), method: "vector" },
        "FAQ matched"
      );
      return { faq: best, confidence: Math.min(bestScore, 1) };
    }

    // Below threshold — no confident FAQ match, let Gemini handle it freely
    logger.info(
      { bestScore: bestScore.toFixed(3), method: "vector" },
      "No confident FAQ match"
    );
    return { faq: null, confidence: bestScore };
  }

  // ── Approach A: Keyword fallback (when embedding API is unavailable) ─────────
  logger.info("Using keyword FAQ matching (embedding unavailable)");
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

  const KEYWORD_THRESHOLD = 0.35;
  return {
    faq: bestScore >= KEYWORD_THRESHOLD ? best : null,
    confidence: Math.min(bestScore, 1),
  };
}
