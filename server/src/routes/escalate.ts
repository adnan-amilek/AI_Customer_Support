import { Router } from "express";
import { escalateLimiter } from "../middleware/rateLimiter.js";
import { validate, escalateSchema } from "../middleware/validate.js";
import { sendEscalationSlack, sendEscalationEmail } from "../services/notifyService.js";
import { markEscalated, getTranscript } from "../db/supabase.js";
import { logger } from "../middleware/logger.js";

export const escalateRouter = Router();

escalateRouter.post(
  "/",
  escalateLimiter,
  validate(escalateSchema),
  async (req, res, next) => {
    const { sessionId, trigger, transcript } = req.body;
    try {
      const fullTranscript =
        transcript.length < 2 ? await getTranscript(sessionId) : transcript;

      const results = await Promise.allSettled([
        sendEscalationSlack(sessionId, trigger, fullTranscript),
        sendEscalationEmail(sessionId, trigger, fullTranscript),
      ]);

      results.forEach((r, i) => {
        if (r.status === "rejected") {
          logger.error({ err: r.reason }, `Notification channel ${i} failed`);
        }
      });

      await markEscalated(sessionId);

      const channels = results
        .map((r, i) => (r.status === "fulfilled" ? (i === 0 ? "slack" : "email") : null))
        .filter(Boolean);

      res.json({ status: "notified", channels });
    } catch (err) {
      next(err);
    }
  }
);
