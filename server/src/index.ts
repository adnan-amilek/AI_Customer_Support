import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { chatRouter } from "./routes/chat.js";
import { leadsRouter } from "./routes/leads.js";
import { escalateRouter } from "./routes/escalate.js";
import { adminRouter } from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./middleware/logger.js";
import { validate, loginSchema } from "./middleware/validate.js";
import { supabase } from "./db/supabase.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── Global middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(","),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "64kb" }));

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({
    status: "ok",
    uptime: process.uptime(),
    ts: new Date().toISOString(),
    mode: supabase ? "supabase" : "in-memory",
    gemini: !!process.env.GEMINI_API_KEY,
  })
);

// ── Admin login ───────────────────────────────────────────────────────────────
app.post("/api/admin/login", validate(loginSchema), (req, res) => {
  const { email, password } = req.body;
  if (
    email === (process.env.ADMIN_EMAIL ?? "admin@demo.com") &&
    password === (process.env.ADMIN_PASSWORD ?? "admin123")
  ) {
    const secret = process.env.ADMIN_JWT_SECRET ?? "dev-secret";
    const token = jwt.sign({ email }, secret, { expiresIn: "24h" });
    logger.info({ email }, "Admin login successful");
    return res.json({ token });
  }
  logger.warn({ email }, "Admin login failed");
  return res.status(401).json({ error: "Invalid credentials" });
});

// ── Gemini connectivity test (dev only) ───────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.get("/api/debug/ai", async (_req, res) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.json({ status: "no_key" });
    // Try models in order of preference
    const candidates = ["gemini-2.5-flash-preview-04-17", "gemini-2.0-flash", "gemini-1.5-flash-latest"];
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(key);
    for (const modelName of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello in 5 words.");
        return res.json({ status: "ok", model: modelName, reply: result.response.text() });
      } catch (err: unknown) {
        const e = err as Record<string, unknown>;
        const status = e instanceof Error ? e.message : String(e);
        if (!status.includes("404")) {
          return res.json({ status: "error", model: modelName, message: status });
        }
        // 404 = model not found, try next
      }
    }
    return res.json({ status: "error", message: "No supported model found for this API key" });
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/chat", chatRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/escalate", escalateRouter);
app.use("/api/admin", adminRouter);

// ── Serve React frontend in production ────────────────────────────────────────
const clientDist = join(__dirname, "../../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback — serve index.html for any non-API route
  app.get("/{*path}", (_req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
} else {
  // ── 404 (API-only mode, no built frontend) ──────────────────────────────────
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
}

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      env: process.env.NODE_ENV,
      db: supabase ? "supabase" : "in-memory",
      ai: process.env.GEMINI_API_KEY ? "gemini" : "mock",
    },
    "🚀 Server started"
  );
});

export default app;
