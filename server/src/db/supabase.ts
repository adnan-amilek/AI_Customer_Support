import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Message } from "../types/index.js";

// ── Supabase (optional) ───────────────────────────────────────────────────────
const isSupabaseEnabled = !!(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseEnabled) {
  supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ── In-memory fallback store ──────────────────────────────────────────────────
interface ConvRecord {
  id: string;
  session_id: string;
  started_at: string;
  escalated: boolean;
  escalated_at: string | null;
  metadata: Record<string, unknown>;
}

interface MsgRecord {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
  confidence?: number;
  created_at: string;
}

export interface FAQRecord {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface LeadRecord {
  id: string;
  conversation_id: string;
  name: string;
  email: string;
  submitted_at: string;
  enriched_data: Record<string, unknown>;
}

export const mem = {
  convs: new Map<string, ConvRecord>(),
  msgs: [] as MsgRecord[],
  leads: [] as LeadRecord[],
  faqs: [
    { id: "1", question: "What are your pricing plans?", answer: "We offer three plans: **Starter** ($29/mo, up to 3 users), **Pro** ($79/mo, unlimited users + analytics), and **Enterprise** (custom pricing with SLA). All plans include a 14-day free trial — no credit card required.", tags: ["pricing", "plans"], active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "2", question: "How do I request a demo?", answer: "Our team offers live 30-minute demos tailored to your use case. Book at **demo.yourcompany.com** or click 'Need a Demo' in this chat and leave your email — we'll reach out within 24 hours.", tags: ["demo", "sales"], active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "3", question: "What integrations do you support?", answer: "We integrate with **Slack, HubSpot, Salesforce, Zapier, Google Workspace**, and 50+ tools via our REST API and webhooks.", tags: ["integrations", "api"], active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "4", question: "Is there a free trial?", answer: "Yes! Every plan starts with a **14-day free trial** — full access, no credit card required. You can upgrade, downgrade, or cancel anytime from your dashboard.", tags: ["trial", "free"], active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "5", question: "How secure is my data?", answer: "We're **SOC 2 Type II certified** and GDPR compliant. We use AES-256 encryption at rest and TLS 1.3 in transit. Data is hosted on AWS us-east-1 with daily backups.", tags: ["security", "compliance"], active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "6", question: "Can I cancel anytime?", answer: "Yes — cancel from Settings → Billing with one click. No cancellation fees. Your data is exportable for 30 days after cancellation.", tags: ["billing", "cancel"], active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: "7", question: "What support options are available?", answer: "We offer:\n• **Live chat** (Pro+): Mon–Fri, 9am–6pm EST\n• **Email support**: support@yourcompany.com (24h response)\n• **Help Center**: docs.yourcompany.com\n• **Enterprise**: Dedicated success manager", tags: ["support", "contact"], active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ] as FAQRecord[],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function memGetOrCreateConv(sessionId: string): ConvRecord {
  let conv = mem.convs.get(sessionId);
  if (!conv) {
    conv = {
      id: randomUUID(),
      session_id: sessionId,
      started_at: new Date().toISOString(),
      escalated: false,
      escalated_at: null,
      metadata: {},
    };
    mem.convs.set(sessionId, conv);
  }
  return conv;
}

// ── Exported DB functions ─────────────────────────────────────────────────────
export async function upsertConversation(
  sessionId: string,
  metadata: Record<string, unknown> = {}
) {
  if (supabase) {
    const { error } = await supabase.from("conversations").upsert(
      { session_id: sessionId, metadata },
      { onConflict: "session_id", ignoreDuplicates: true }
    );
    if (error) throw new Error(`upsertConversation: ${error.message}`);
  } else {
    if (!mem.convs.has(sessionId)) {
      mem.convs.set(sessionId, {
        id: randomUUID(),
        session_id: sessionId,
        started_at: new Date().toISOString(),
        escalated: false,
        escalated_at: null,
        metadata,
      });
    }
  }
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  source?: string,
  confidence?: number
) {
  if (supabase) {
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("id")
      .eq("session_id", sessionId)
      .single();
    if (convErr) throw new Error(`saveMessage (conv lookup): ${convErr.message}`);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conv.id,
      role,
      content,
      source,
      confidence,
    });
    if (error) throw new Error(`saveMessage: ${error.message}`);
  } else {
    const conv = memGetOrCreateConv(sessionId);
    mem.msgs.push({
      id: randomUUID(),
      conversation_id: conv.id,
      role,
      content,
      source,
      confidence,
      created_at: new Date().toISOString(),
    });
  }
}

export async function markEscalated(sessionId: string) {
  if (supabase) {
    const { error } = await supabase
      .from("conversations")
      .update({ escalated: true, escalated_at: new Date().toISOString() })
      .eq("session_id", sessionId);
    if (error) throw new Error(`markEscalated: ${error.message}`);
  } else {
    const conv = mem.convs.get(sessionId);
    if (conv) {
      conv.escalated = true;
      conv.escalated_at = new Date().toISOString();
    }
  }
}

export async function getTranscript(sessionId: string): Promise<Message[]> {
  if (supabase) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("session_id", sessionId)
      .single();
    if (!conv) return [];
    const { data, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`getTranscript: ${error.message}`);
    return (data ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  } else {
    const conv = mem.convs.get(sessionId);
    if (!conv) return [];
    return mem.msgs
      .filter((m) => m.conversation_id === conv.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((m) => ({ role: m.role, content: m.content }));
  }
}

export async function captureLead(
  sessionId: string,
  name: string,
  email: string
): Promise<string> {
  if (supabase) {
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("id")
      .eq("session_id", sessionId)
      .single();
    if (convErr) throw new Error(`captureLead (conv): ${convErr.message}`);

    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("conversation_id", conv.id)
      .maybeSingle();
    if (existing) return existing.id;

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({ conversation_id: conv.id, name, email })
      .select("id")
      .single();
    if (error) throw new Error(`captureLead (insert): ${error.message}`);
    return lead.id;
  } else {
    const conv = memGetOrCreateConv(sessionId);
    const existing = mem.leads.find((l) => l.conversation_id === conv.id);
    if (existing) return existing.id;
    const id = randomUUID();
    mem.leads.push({
      id,
      conversation_id: conv.id,
      name,
      email,
      submitted_at: new Date().toISOString(),
      enriched_data: {},
    });
    return id;
  }
}
