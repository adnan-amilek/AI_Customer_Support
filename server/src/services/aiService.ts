import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Message } from "../types/index.js";
import type { Response } from "express";
import { logger } from "../middleware/logger.js";

const isGeminiEnabled = !!process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (isGeminiEnabled) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const SYSTEM_PROMPT = `You are a helpful, friendly customer support assistant for Clarix, a B2B SaaS platform.

KNOWLEDGE BASE — always answer from this first:
• Pricing: Starter $29/mo (up to 3 users), Pro $79/mo (unlimited users + analytics), Enterprise (custom pricing + SLA). All plans include a 14-day free trial, no credit card required.
• Demo: We offer 30-minute live demos tailored to your use case. Book at demo.clarix.qa.team or share your email and we'll follow up within 24 hours.
• Integrations: 50+ tools — Slack, HubSpot, Salesforce, Zapier, Google Workspace, and more. Full REST API + webhooks for custom integrations.
• Free Trial: 14-day free trial on all plans, full access, no credit card. Upgrade, downgrade, or cancel anytime.
• Support: Live chat (Pro+) Mon–Fri 9am–6pm EST; Email clarix@qa.team (24h response); Help Center at docs.clarix.qa.team; Enterprise gets a dedicated success manager.
• Security: SOC 2 Type II certified, GDPR compliant, AES-256 encryption at rest, TLS 1.3 in transit, hosted on AWS us-east-1 with daily backups.
• Cancellation: Cancel anytime from Settings → Billing — one click, no fees. Data exportable for 30 days after cancellation.
• Onboarding: Guided setup wizard, video library, dedicated onboarding specialist for Pro and Enterprise plans. Most teams are live in under a day.
• Languages: Platform is available in English, Spanish, French, German, Portuguese, and Japanese.
• Competitors: We focus on reliability, ease of use, and deep integrations. Happy to do a comparison call.

BEHAVIOR RULES:
- Answer concisely (under 80 words unless detail is essential)
- Use bullet points only when listing 3+ items
- Be warm and professional — never robotic
- If you don't know something specific, say so honestly
- Never fabricate pricing, feature claims, or company information
- If the user seems frustrated, acknowledge their frustration first before answering
- Do NOT suggest escalating to a human agent automatically; only mention it if the user explicitly requests it`;

// Mock responses for demo mode (no Gemini key or quota exhausted)
const MOCK_RESPONSES = [
  "Thanks for reaching out! I'm happy to help. You can ask me about our **pricing plans**, **integrations**, **free trial**, **security**, or request a **demo**. What would you like to know?",
  "Great question! Our platform helps teams work smarter. We offer **Starter** ($29/mo), **Pro** ($79/mo), and **Enterprise** plans — all with a 14-day free trial. Want more details on any of these?",
  "I'd be glad to assist! Feel free to ask about **features**, **pricing**, **integrations** (Slack, HubSpot, Salesforce, and 50+ more), or anything else about our platform.",
  "Of course! Here's a quick overview: we're a B2B SaaS platform with SOC 2 Type II certification, 50+ integrations, and plans starting at $29/mo. Would you like a live demo or more details on a specific topic?",
];

let mockIdx = 0;
function getMockResponse(): string {
  return MOCK_RESPONSES[mockIdx++ % MOCK_RESPONSES.length];
}

/**
 * Build Gemini-compatible history from the conversation context.
 * Gemini requires: history must NOT be empty if provided, and the
 * first turn MUST have role "user". We drop any leading assistant
 * turns to satisfy this constraint.
 */
function toGeminiHistory(history: Message[]) {
  // Drop messages until we hit the first user turn
  const firstUserIdx = history.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return []; // no user message at all — send empty history

  return history.slice(firstUserIdx).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

// ── Standard (non-streaming) call ──────────────────────────────────────────
export async function getAIResponse(
  userMessage: string,
  history: Message[],
  faqContext?: string
): Promise<string> {
  if (!genAI) return getMockResponse();

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      safetySettings: SAFETY,
      systemInstruction: SYSTEM_PROMPT,
    });

    // If a FAQ answer was matched, inject it as grounding context
    const augmentedMessage = faqContext
      ? `[KNOWLEDGE BASE CONTEXT — use this as ground truth but reply naturally]:\n${faqContext}\n\n[USER QUESTION]: ${userMessage}`
      : userMessage;

    // Only pass history if it has at least one turn
    const geminiHistory = toGeminiHistory(history.slice(-10));
    const chat = model.startChat(geminiHistory.length ? { history: geminiHistory } : {});
    const result = await chat.sendMessage(augmentedMessage);
    return result.response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ geminiError: msg }, "Gemini call failed — using demo response");
    return getMockResponse();
  }
}

// ── SSE streaming call — writes chunks directly to Express response ─────────
export async function streamAIResponse(
  userMessage: string,
  history: Message[],
  res: Response,
  faqContext?: string
): Promise<string> {
  if (!genAI) {
    const text = getMockResponse();
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, source: "fallback" })}\n\n`);
    res.end();
    return text;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    safetySettings: SAFETY,
    systemInstruction: SYSTEM_PROMPT,
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // If a FAQ answer was matched, inject it as grounding context
  const augmentedMessage = faqContext
    ? `[KNOWLEDGE BASE CONTEXT — use this as ground truth but reply naturally]:\n${faqContext}\n\n[USER QUESTION]: ${userMessage}`
    : userMessage;

  try {
    const geminiHistory = toGeminiHistory(history.slice(-10));
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
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ geminiError: msg }, "Gemini stream failed — using demo response");
    const text = getMockResponse();
    res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, source: "fallback" })}\n\n`);
    res.end();
    return text;
  }
}
