import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

const UUID = z.string().uuid();

export const chatSchema = z.object({
  sessionId: UUID,
  message: z.string().min(1).max(1000),
  context: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .default([]),
});

export const leadSchema = z.object({
  sessionId: UUID,
  name: z.string().min(1).max(120),
  email: z.string().email(),
});

export const escalateSchema = z.object({
  sessionId: UUID,
  trigger: z.enum(["user_request", "low_confidence"]),
  transcript: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .max(100),
});

export const faqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  tags: z.array(z.string()).max(10).default([]),
  active: z.boolean().default(true),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    }
    req.body = result.data;
    next();
  };
}
