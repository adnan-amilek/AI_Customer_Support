import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { adminLimiter } from "../middleware/rateLimiter.js";
import { validate, faqSchema } from "../middleware/validate.js";
import { supabase, mem } from "../db/supabase.js";
import { invalidateFAQCache } from "../services/faqService.js";
import { logger } from "../middleware/logger.js";
import { randomUUID } from "node:crypto";

export const adminRouter = Router();
adminRouter.use(requireAuth, adminLimiter);

// ── Conversations ─────────────────────────────────────────────────────────────
adminRouter.get("/conversations", async (req, res, next) => {
  try {
    if (supabase) {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const from = (page - 1) * limit;

      let query = supabase
        .from("conversations")
        .select("*, messages(count)", { count: "exact" })
        .order("started_at", { ascending: false })
        .range(from, from + limit - 1);

      if (req.query.escalated === "true") query = query.eq("escalated", true);
      if (req.query.from) query = query.gte("started_at", req.query.from as string);
      if (req.query.to) query = query.lte("started_at", req.query.to as string);

      const { data, count, error } = await query;
      if (error) throw error;
      res.json({ data, total: count, page, limit });
    } else {
      const all = Array.from(mem.convs.values()).sort(
        (a, b) => b.started_at.localeCompare(a.started_at)
      );
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const sliced = all.slice((page - 1) * limit, page * limit);
      res.json({ data: sliced, total: all.length, page, limit });
    }
  } catch (err) {
    next(err);
  }
});

adminRouter.get("/conversations/:sessionId", async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(*)")
        .eq("session_id", req.params.sessionId)
        .single();
      if (error || !data) return res.status(404).json({ error: "Not found" });
      res.json(data);
    } else {
      const conv = mem.convs.get(req.params.sessionId);
      if (!conv) return res.status(404).json({ error: "Not found" });
      const messages = mem.msgs.filter((m) => m.conversation_id === conv.id);
      res.json({ ...conv, messages });
    }
  } catch (err) {
    next(err);
  }
});

// ── Leads ─────────────────────────────────────────────────────────────────────
adminRouter.get("/leads", async (req, res, next) => {
  try {
    if (supabase) {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
      const from = (page - 1) * limit;

      let query = supabase
        .from("leads")
        .select("*", { count: "exact" })
        .order("submitted_at", { ascending: false })
        .range(from, from + limit - 1);

      if (req.query.search) {
        query = query.or(
          `name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%`
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;
      res.json({ data, total: count, page, limit });
    } else {
      const search = (req.query.search as string | undefined)?.toLowerCase();
      const all = mem.leads
        .filter((l) =>
          !search || l.name.toLowerCase().includes(search) || l.email.toLowerCase().includes(search)
        )
        .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
      res.json({ data: all, total: all.length, page: 1, limit: all.length });
    }
  } catch (err) {
    next(err);
  }
});

// ── FAQs CRUD ─────────────────────────────────────────────────────────────────
adminRouter.get("/faqs", async (_req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      res.json(data);
    } else {
      res.json([...mem.faqs].reverse());
    }
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/faqs", validate(faqSchema), async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("faqs")
        .insert(req.body)
        .select()
        .single();
      if (error) throw error;
      invalidateFAQCache();
      logger.info({ faqId: data.id }, "FAQ created");
      res.status(201).json(data);
    } else {
      const now = new Date().toISOString();
      const faq = { id: randomUUID(), ...req.body, created_at: now, updated_at: now };
      mem.faqs.push(faq);
      invalidateFAQCache();
      res.status(201).json(faq);
    }
  } catch (err) {
    next(err);
  }
});

adminRouter.put("/faqs/:id", validate(faqSchema), async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("faqs")
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select()
        .single();
      if (error || !data) return res.status(404).json({ error: "FAQ not found" });
      invalidateFAQCache();
      res.json(data);
    } else {
      const idx = mem.faqs.findIndex((f) => f.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: "FAQ not found" });
      mem.faqs[idx] = { ...mem.faqs[idx], ...req.body, updated_at: new Date().toISOString() };
      invalidateFAQCache();
      res.json(mem.faqs[idx]);
    }
  } catch (err) {
    next(err);
  }
});

adminRouter.patch("/faqs/:id/toggle", async (req, res, next) => {
  try {
    if (supabase) {
      const { data: current } = await supabase
        .from("faqs").select("active").eq("id", req.params.id).single();
      if (!current) return res.status(404).json({ error: "FAQ not found" });
      const { data, error } = await supabase
        .from("faqs")
        .update({ active: !current.active, updated_at: new Date().toISOString() })
        .eq("id", req.params.id)
        .select()
        .single();
      if (error) throw error;
      invalidateFAQCache();
      res.json(data);
    } else {
      const faq = mem.faqs.find((f) => f.id === req.params.id);
      if (!faq) return res.status(404).json({ error: "FAQ not found" });
      faq.active = !faq.active;
      faq.updated_at = new Date().toISOString();
      invalidateFAQCache();
      res.json(faq);
    }
  } catch (err) {
    next(err);
  }
});

adminRouter.delete("/faqs/:id", async (req, res, next) => {
  try {
    if (supabase) {
      const { error } = await supabase.from("faqs").delete().eq("id", req.params.id);
      if (error) throw error;
    } else {
      const idx = mem.faqs.findIndex((f) => f.id === req.params.id);
      if (idx !== -1) mem.faqs.splice(idx, 1);
    }
    invalidateFAQCache();
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// ── Analytics ─────────────────────────────────────────────────────────────────
adminRouter.get("/analytics", async (_req, res, next) => {
  try {
    if (supabase) {
      const [convos, leads, escalated, faqMessages] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("escalated", true),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("source", "faq"),
      ]);
      const totalConvos = convos.count ?? 0;
      const totalLeads = leads.count ?? 0;
      const totalEscalated = escalated.count ?? 0;
      const faqCount = faqMessages.count ?? 0;
      res.json({
        totalConversations: totalConvos,
        totalLeads,
        escalationRate: totalConvos ? ((totalEscalated / totalConvos) * 100).toFixed(1) + "%" : "0%",
        faqResolutionRate: totalConvos ? ((faqCount / totalConvos) * 100).toFixed(1) + "%" : "0%",
      });
    } else {
      const totalConvos = mem.convs.size;
      const totalLeads = mem.leads.length;
      const totalEscalated = Array.from(mem.convs.values()).filter((c) => c.escalated).length;
      const faqCount = mem.msgs.filter((m) => m.source === "faq").length;
      res.json({
        totalConversations: totalConvos,
        totalLeads,
        escalationRate: totalConvos ? ((totalEscalated / totalConvos) * 100).toFixed(1) + "%" : "0%",
        faqResolutionRate: totalConvos ? ((faqCount / totalConvos) * 100).toFixed(1) + "%" : "0%",
      });
    }
  } catch (err) {
    next(err);
  }
});
