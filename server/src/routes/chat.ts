import { Router } from "express";
import { chatLimiter } from "../middleware/rateLimiter.js";
import { validate, chatSchema } from "../middleware/validate.js";
import { matchFAQ } from "../services/faqService.js";
import { getAIResponse, streamAIResponse } from "../services/aiService.js";
import { upsertConversation, saveMessage } from "../db/supabase.js";
import type { ChatRequest, ChatResponse } from "../types/index.js";
import { logger } from "../middleware/logger.js";

export const chatRouter = Router();

// Standard JSON response
chatRouter.post(
  "/message",
  chatLimiter,
  validate(chatSchema),
  async (req, res, next) => {
    const { sessionId, message, context } = req.body as ChatRequest;
    const t0 = Date.now();

    try {
      await upsertConversation(sessionId, {
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });
      await saveMessage(sessionId, "user", message);

      // 1. Try FAQ match
      const { faq, confidence } = await matchFAQ(message);
      let reply: string, source: "faq" | "llm" | "fallback";

      if (faq && confidence >= 0.35) {
        reply = faq.answer;
        source = "faq";
      } else {
        // 2. Gemini LLM fallback
        try {
          reply = await getAIResponse(message, context);
          source = "llm";
        } catch (aiErr) {
          logger.warn({ aiErr }, "AI call failed — serving fallback");
          reply =
            "I'm having trouble connecting right now. Would you like me to connect you with a human agent?";
          source = "fallback";
        }
      }

      await saveMessage(sessionId, "assistant", reply, source, confidence);

      // Never auto-escalate — let the user choose via "Talk to a Human"
      const escalate = false;

      logger.info(
        { sessionId, source, confidence: confidence.toFixed(2), ms: Date.now() - t0 },
        "Chat message processed"
      );

      const response: ChatResponse = {
        reply,
        source,
        confidence,
        escalate,
        faqId: faq?.id,
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// SSE streaming endpoint
chatRouter.post(
  "/stream",
  chatLimiter,
  validate(chatSchema),
  async (req, res, next) => {
    const { sessionId, message, context } = req.body as ChatRequest;
    try {
      await upsertConversation(sessionId);
      await saveMessage(sessionId, "user", message);

      const { faq, confidence } = await matchFAQ(message);
      if (faq && confidence >= 0.35) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.flushHeaders();
        res.write(`data: ${JSON.stringify({ chunk: faq.answer })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true, source: "faq" })}\n\n`);
        res.end();
        await saveMessage(sessionId, "assistant", faq.answer, "faq", confidence);
        return;
      }

      const fullText = await streamAIResponse(message, context, res);
      await saveMessage(sessionId, "assistant", fullText, "llm", confidence);
    } catch (err) {
      next(err);
    }
  }
);
