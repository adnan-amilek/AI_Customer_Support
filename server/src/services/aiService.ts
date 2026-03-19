import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Message } from "../types/index.js";
import type { Response } from "express";
import { logger } from "../middleware/logger.js";
import { mem, DEFAULT_SYSTEM_PROMPT } from "../db/supabase.js";

function getSystemPrompt(): string {
  return mem.settings.systemPrompt || DEFAULT_SYSTEM_PROMPT;
}

const isGeminiEnabled = !!process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (isGeminiEnabled) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

// Model fallback chain — tries each in order on 429 quota errors
const MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const FALLBACK_MESSAGE =
  "I'm Clarix's support assistant and I can only help with orders, shipping, returns, payments, and account questions. For anything outside that, please reach out directly at **Clarix@qa.team** — we're happy to help!";

/**
 * Build Gemini-compatible history from the conversation context.
 * Gemini requires: history must NOT be empty if provided, and the
 * first turn MUST have role "user". We drop any leading assistant
 * turns to satisfy this constraint.
 */
function toGeminiHistory(history: Message[]) {
  const firstUserIdx = history.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return [];
  return history.slice(firstUserIdx).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("404")  // model not found — skip to next
  );
}

// ── Standard (non-streaming) call ──────────────────────────────────────────
export async function getAIResponse(
  userMessage: string,
  history: Message[],
  faqContext?: string
): Promise<string> {
  if (!genAI) return faqContext ?? FALLBACK_MESSAGE;

  const augmentedMessage = faqContext
    ? `[KNOWLEDGE BASE CONTEXT — use this as ground truth but reply naturally]:\n${faqContext}\n\n[USER QUESTION]: ${userMessage}`
    : userMessage;

  const geminiHistory = toGeminiHistory(history.slice(-10));

  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: SAFETY,
        systemInstruction: getSystemPrompt(),
      });
      const chat = model.startChat(geminiHistory.length ? { history: geminiHistory } : {});
      const result = await chat.sendMessage(augmentedMessage);
      if (modelName !== MODEL_CHAIN[0]) {
        logger.info({ model: modelName }, "Gemini fallback model used");
      }
      return result.response.text();
    } catch (err) {
      if (isRetryable(err)) {
        logger.warn({ model: modelName }, "Gemini quota exceeded — trying next model");
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ geminiError: msg }, "Gemini call failed — using FAQ or fallback");
      return faqContext ?? FALLBACK_MESSAGE;
    }
  }

  logger.warn("All Gemini models quota exceeded — using FAQ or fallback");
  return faqContext ?? FALLBACK_MESSAGE;
}

// ── SSE streaming call — writes chunks directly to Express response ─────────
export async function streamAIResponse(
  userMessage: string,
  history: Message[],
  res: Response,
  faqContext?: string
): Promise<string> {
  const sendFallback = (text: string, source: string) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, source })}\n\n`);
    res.end();
    return text;
  };

  if (!genAI) return sendFallback(faqContext ?? FALLBACK_MESSAGE, faqContext ? "faq" : "fallback");

  const augmentedMessage = faqContext
    ? `[KNOWLEDGE BASE CONTEXT — use this as ground truth but reply naturally]:\n${faqContext}\n\n[USER QUESTION]: ${userMessage}`
    : userMessage;

  const geminiHistory = toGeminiHistory(history.slice(-10));

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: SAFETY,
        systemInstruction: getSystemPrompt(),
      });
      const chat = model.startChat(geminiHistory.length ? { history: geminiHistory } : {});
      const result = await chat.sendMessageStream(augmentedMessage);

      let fullText = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullText += text;
        res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return fullText;
    } catch (err) {
      if (isRetryable(err)) {
        logger.warn({ model: modelName }, "Gemini stream quota exceeded — trying next model");
        continue;
      }
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ geminiError: msg }, "Gemini stream failed — using FAQ or fallback");
      const text = faqContext ?? FALLBACK_MESSAGE;
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, source: faqContext ? "faq" : "fallback" })}\n\n`);
      res.end();
      return text;
    }
  }

  logger.warn("All Gemini stream models quota exceeded — using FAQ or fallback");
  const text = faqContext ?? FALLBACK_MESSAGE;
  res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
  res.write(`data: ${JSON.stringify({ done: true, source: faqContext ? "faq" : "fallback" })}\n\n`);
  res.end();
  return text;
}
