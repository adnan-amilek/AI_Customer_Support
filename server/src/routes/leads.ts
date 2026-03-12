import { Router } from "express";
import { leadLimiter } from "../middleware/rateLimiter.js";
import { validate, leadSchema } from "../middleware/validate.js";
import { captureLead } from "../db/supabase.js";
import { logger } from "../middleware/logger.js";

export const leadsRouter = Router();

leadsRouter.post(
  "/",
  leadLimiter,
  validate(leadSchema),
  async (req, res, next) => {
    try {
      const { sessionId, name, email } = req.body;
      const leadId = await captureLead(sessionId, name, email);
      logger.info({ leadId, email }, "Lead captured");
      res.status(201).json({ leadId, status: "captured" });
    } catch (err) {
      next(err);
    }
  }
);
