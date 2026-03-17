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

const SYSTEM_PROMPT = `You are a helpful, friendly customer support assistant for an ecommerce store. You are trained on this store's data and policies — always answer from this knowledge base first.

KNOWLEDGE BASE:

ORDERS & TRACKING:
• Customers can track their order via the "Track My Order" page using their order number and email address.
• Orders are processed within 1–2 business days. A confirmation email with tracking info is sent once shipped.
• To modify or cancel an order, contact support within 1 hour of placing it — after that it may already be packed.

SHIPPING:
• Standard Shipping: 5–7 business days — Free on orders over $50, otherwise $4.99.
• Express Shipping: 2–3 business days — $9.99.
• Overnight Shipping: Next business day — $19.99.
• International Shipping: 10–21 business days — rates calculated at checkout. Customs/duties are the buyer's responsibility.
• Orders placed before 2pm EST on weekdays ship same day.

RETURNS & REFUNDS:
• 30-day hassle-free return policy on all unused, unopened items in original packaging.
• To start a return, visit the Returns Portal or email support with your order number.
• Refunds are processed within 5–7 business days after the returned item is received.
• Sale/clearance items and digital products are final sale — no returns.
• Damaged or wrong items: contact support within 48 hours with a photo — we'll send a replacement or full refund, no return needed.

PAYMENTS:
• Accepted: Visa, Mastercard, Amex, PayPal, Apple Pay, Google Pay, and Shop Pay.
• Buy Now Pay Later: Available via Klarna (4 interest-free installments).
• All transactions are secured with SSL encryption and PCI DSS compliance.
• Promo codes can be applied at checkout. Only one code per order.

PRODUCTS:
• All products come with a 1-year manufacturer warranty unless stated otherwise.
• Product availability is shown on each listing. "In Stock" items ship within 1–2 business days.
• Out-of-stock items can be added to a wishlist — you'll get an email when they're back.

ACCOUNT & LOYALTY:
• Create a free account to track orders, save addresses, and earn loyalty points.
• Loyalty points: earn 1 point per $1 spent. 100 points = $1 discount on future orders.
• Password reset: click "Forgot Password" on the login page — reset link sent within 2 minutes.

CONTACT & SUPPORT:
• Live Chat: Available Mon–Fri 9am–8pm EST, Sat 10am–6pm EST.
• Email: support@store.com — response within 24 hours on business days.
• Phone: 1-800-123-4567 — Mon–Fri 9am–6pm EST.

BEHAVIOR RULES:
- Answer concisely (under 80 words unless detail is essential)
- Use bullet points only when listing 3+ items
- Be warm and professional — never robotic
- If you don't know something specific about a product, say so honestly and direct them to the product page or support
- Never fabricate order details, pricing, or policies
- If the user seems frustrated, acknowledge their frustration first before answering
- Do NOT suggest escalating to a human agent automatically; only mention it if the user explicitly requests it`;

// Mock responses for demo mode (no Gemini key or quota exhausted)
const MOCK_RESPONSES = [
  "Thanks for reaching out! I'm happy to help. You can ask me about **order tracking**, **shipping**, **returns & refunds**, **payments**, or anything else about your order. What do you need?",
  "Great question! We offer **free standard shipping** on orders over $50, **express** (2–3 days) for $9.99, and **overnight** delivery for $19.99. All orders come with a 30-day return policy. Anything else I can help with?",
  "I'd be glad to assist! You can track your order on our **Track My Order** page using your order number and email. Need help with something else like a return or payment question?",
  "Of course! We accept Visa, Mastercard, Amex, PayPal, Apple Pay, Google Pay, and **Klarna** (Buy Now Pay Later). All transactions are SSL-secured. Can I help you with anything else?",
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
