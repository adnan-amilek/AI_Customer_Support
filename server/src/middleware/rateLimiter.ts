import rateLimit from "express-rate-limit";

const opts = (max: number, windowMs = 60_000) =>
  rateLimit({
    max,
    windowMs,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({ error: "Too many requests — please slow down" }),
  });

export const chatLimiter     = opts(30);   // 30 req/min
export const leadLimiter     = opts(5);    // 5 submissions/min
export const escalateLimiter = opts(10);   // 10/min
export const adminLimiter    = opts(100);  // 100/min for admin reads
