import { useState, useMemo } from "react";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  indigo: "#6366f1", violet: "#7c3aed", emerald: "#10b981",
  amber: "#f59e0b", rose: "#f43f5e", sky: "#0ea5e9", gray: "#6b7280",
};

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, sw = 2, fill = "none" }: { d: string | string[]; size?: number; sw?: number; fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

// ── Seed Data ─────────────────────────────────────────────────────────────────
const now = Date.now();

interface Convo {
  id: string; date: string; messages: number; source: string;
  escalated: boolean; lead: boolean; preview: string;
  transcript: { role: string; text: string; source?: string }[];
}
interface Lead {
  id: string; name: string; email: string; date: string;
  sessionId: string; intent: string; status: string;
}
interface FAQ {
  id: number; q: string; a: string; tags: string[]; active: boolean; hits: number;
}

const CONVOS: Convo[] = Array.from({ length: 28 }, (_, i) => ({
  id: `sess-${1000 + i}`,
  date: new Date(now - i * 3.2 * 3600000).toISOString(),
  messages: Math.floor(Math.random() * 10) + 2,
  source: ["faq", "llm", "mixed"][i % 3],
  escalated: i % 7 === 0,
  lead: i % 4 === 0,
  preview: ["What are your pricing plans?", "I'd like to request a demo", "Do you support Salesforce?", "How does your billing work?", "Can I cancel anytime?", "What security certifications do you have?", "Is there a free trial?", "How many users are included?"][i % 8],
  transcript: [
    { role: "user", text: ["What are your pricing plans?", "Do you offer a free trial?", "I need a demo"][i % 3] },
    { role: "bot", text: "We offer three plans: Starter ($29/mo), Pro ($79/mo), and Enterprise (custom pricing). All plans include a 14-day free trial.", source: "faq" },
    { role: "user", text: "What's included in the Pro plan?" },
    { role: "bot", text: "Pro includes unlimited users, advanced analytics, priority support, and all integrations. It's our most popular tier.", source: "llm" },
  ],
}));

const LEADS: Lead[] = Array.from({ length: 18 }, (_, i) => ({
  id: `lead-${200 + i}`,
  name: ["Alice Martin", "Bob Chen", "Sara Lee", "James Kirk", "Nina Patel", "Tom Reeves", "Lena Ford", "Omar Hassan", "Chloe Zhao", "Raj Mehta", "Fiona Walsh", "Diego Ruiz", "Maya Singh", "Ethan Brooks", "Zoe Lambert", "Arjun Das", "Claire Dumont", "Sam Wheeler"][i],
  email: ["alice", "bob", "sara", "james", "nina", "tom", "lena", "omar", "chloe", "raj", "fiona", "diego", "maya", "ethan", "zoe", "arjun", "claire", "sam"][i] + "@example.com",
  date: new Date(now - i * 4.5 * 3600000).toISOString(),
  sessionId: `sess-${1000 + i * 2}`,
  intent: ["Pricing", "Demo", "Integration", "Enterprise", "Pricing", "Demo", "Integration", "Pricing", "Enterprise", "Demo", "Pricing", "Integration", "Demo", "Pricing", "Enterprise", "Demo", "Pricing", "Integration"][i],
  status: ["new", "contacted", "qualified", "new", "contacted", "new", "qualified", "new", "contacted", "new"][i % 10],
}));

const INIT_FAQS: FAQ[] = [
  { id: 1, q: "What are your pricing plans?", a: "We offer three plans: Starter ($29/mo), Pro ($79/mo), and Enterprise (custom). All plans include a 14-day free trial.", tags: ["pricing", "plans"], active: true, hits: 142 },
  { id: 2, q: "How do I request a demo?", a: "Book a live demo at demo.clarix.qa.team or click 'Need a Demo' in the chat widget.", tags: ["demo", "sales"], active: true, hits: 98 },
  { id: 3, q: "What integrations do you support?", a: "We integrate with Slack, HubSpot, Salesforce, Zapier, Google Workspace and 50+ tools via our REST API.", tags: ["integrations", "api"], active: true, hits: 76 },
  { id: 4, q: "Is there a free trial?", a: "Yes — every plan starts with a 14-day free trial. Full access, no credit card required.", tags: ["trial", "pricing"], active: true, hits: 64 },
  { id: 5, q: "How secure is my data?", a: "We are SOC 2 Type II certified, GDPR compliant, use AES-256 encryption at rest and TLS 1.3 in transit.", tags: ["security", "compliance"], active: true, hits: 51 },
  { id: 6, q: "Can I cancel anytime?", a: "Yes — cancel from Settings → Billing with one click. No fees. Data exportable for 30 days post-cancellation.", tags: ["billing", "cancel"], active: false, hits: 39 },
  { id: 7, q: "What support options are available?", a: "Live chat (Pro+), email support (24h response), Help Center, and a dedicated success manager for Enterprise.", tags: ["support", "contact"], active: true, hits: 33 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  const d = new Date(iso), n = new Date();
  const diff = Math.floor((n.getTime() - d.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const Badge = ({ label, color }: { label: string; color: string }) => {
  const map: Record<string, string> = {
    emerald: "#064e3b:#6ee7b7", amber: "#78350f:#fcd34d", rose: "#881337:#fda4af",
    indigo: "#312e81:#a5b4fc", sky: "#0c4a6e:#7dd3fc", gray: "#1f2937:#9ca3af", violet: "#4c1d95:#c4b5fd"
  };
  const [bg, tx] = (map[color] || map.gray).split(":");
  return <span style={{ background: bg + "33", color: tx, border: `1px solid ${bg}55` }} className="px-2 py-0.5 rounded-full text-xs font-semibold">{label}</span>;
};

const StatCard = ({ label, value, sub, icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: string;
}) => (
  <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-400 font-medium">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      {trend && <p className={`text-xs mt-1 font-semibold ${trend.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>{trend} vs last week</p>}
    </div>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "22", color }}>
      {icon}
    </div>
  </div>
);

const BAR_DATA = [12, 18, 14, 22, 19, 27, 31, 24, 28, 35, 29, 38, 33, 41];
const MiniChart = () => {
  const max = Math.max(...BAR_DATA);
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 font-medium">Conversations / day</p>
          <p className="text-2xl font-bold text-white mt-0.5">↑ 28%</p>
        </div>
        <Badge label="Last 14 days" color="indigo" />
      </div>
      <div className="flex items-end gap-1 h-16">
        {BAR_DATA.map((v, i) => (
          <div key={i} className="flex-1 rounded-t-sm transition-all"
            style={{ height: `${(v / max) * 100}%`, background: i === BAR_DATA.length - 1 ? C.indigo : C.indigo + "55" }} />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">14 days ago</span>
        <span className="text-xs text-gray-500">Today</span>
      </div>
    </div>
  );
};

const DonutChart = () => {
  const segs = [
    { label: "FAQ Match", pct: 62, color: C.emerald },
    { label: "AI (LLM)",  pct: 26, color: C.indigo },
    { label: "Escalated", pct: 12, color: C.amber },
  ];
  let cum = 0;
  const r = 40, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <p className="text-sm text-gray-400 font-medium mb-4">Resolution Sources</p>
      <div className="flex items-center gap-4">
        <svg width={120} height={120}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#374151" strokeWidth={16} />
          {segs.map((s, i) => {
            const offset = circ * (1 - cum / 100);
            const dash = circ * s.pct / 100;
            cum += s.pct;
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={16} strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset} strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }} />;
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="#9ca3af">Total</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={16} fontWeight="bold" fill="#f9fafb">{CONVOS.length}</text>
        </svg>
        <div className="flex flex-col gap-2">
          {segs.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-gray-400">{s.label}</span>
              <span className="text-xs font-bold text-white ml-auto pl-3">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TranscriptModal = ({ convo, onClose }: { convo: Convo; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
    <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-700" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <p className="font-semibold text-white text-sm">Session {convo.id}</p>
          <p className="text-xs text-gray-500">{fmtDate(convo.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {convo.escalated && <Badge label="Escalated" color="amber" />}
          {convo.lead && <Badge label="Lead" color="emerald" />}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 ml-2">
            <Ic d="M18 6L6 18M6 6l12 12" />
          </button>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-3 max-h-80 overflow-y-auto">
        {convo.transcript.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-200 rounded-bl-sm"}`}>
              {m.text}
              {m.source && <span className="block text-[10px] mt-1 opacity-60">{m.source === "faq" ? "✓ FAQ" : "✦ AI"}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FAQModal = ({ faq, onSave, onClose }: {
  faq: FAQ | null;
  onSave: (data: { q: string; a: string; tags: string[] }) => void;
  onClose: () => void;
}) => {
  const [q, setQ] = useState(faq?.q || "");
  const [a, setA] = useState(faq?.a || "");
  const [tags, setTags] = useState(faq?.tags?.join(", ") || "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <p className="font-semibold text-white">{faq ? "Edit FAQ" : "Add New FAQ"}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><Ic d="M18 6L6 18M6 6l12 12" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Question</label>
            <input value={q} onChange={(e) => setQ(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Answer</label>
            <textarea value={a} onChange={(e) => setA(e.target.value)} rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 border border-gray-700 rounded-xl hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={() => { if (q && a) onSave({ q, a, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }); }}
            className="px-5 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 font-medium transition-colors">
            {faq ? "Save Changes" : "Add FAQ"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Conversations", "Leads", "FAQ Manager"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [filterEsc, setFilterEsc] = useState(false);
  const [filterLead, setFilterLead] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<Convo | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>(INIT_FAQS);
  const [faqModal, setFaqModal] = useState<null | "new" | FAQ>(null);
  const [leadStatus, setLeadStatus] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const filteredConvos = useMemo(() => CONVOS.filter((c) => {
    if (filterEsc && !c.escalated) return false;
    if (filterLead && !c.lead) return false;
    if (search && !c.preview.toLowerCase().includes(search.toLowerCase()) && !c.id.includes(search)) return false;
    return true;
  }), [search, filterEsc, filterLead]);

  const filteredLeads = useMemo(() => LEADS.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.includes(search)
  ), [search]);

  const saveFAQ = (data: { q: string; a: string; tags: string[] }) => {
    if (faqModal === "new") {
      setFaqs((f) => [...f, { id: Date.now(), ...data, active: true, hits: 0 }]);
      showToast("FAQ added successfully");
    } else if (faqModal && faqModal !== "new") {
      setFaqs((f) => f.map((x) => x.id === (faqModal as FAQ).id ? { ...x, ...data } : x));
      showToast("FAQ updated");
    }
    setFaqModal(null);
  };

  const toggleFAQ = (id: number) => setFaqs((f) => f.map((x) => x.id === id ? { ...x, active: !x.active } : x));
  const deleteFAQ = (id: number) => { setFaqs((f) => f.filter((x) => x.id !== id)); showToast("FAQ deleted"); };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Intent", "Status", "Date"],
      ...LEADS.map((l) => [l.name, l.email, l.intent, l.status, new Date(l.date).toLocaleDateString()])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv]));
    a.download = "leads.csv"; a.click();
    showToast("CSV exported!");
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans">
      {/* Top Nav */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            Q
          </div>
          <span className="font-bold text-white text-sm">Clarix</span>
          <span className="text-gray-700">|</span>
          <span className="text-xs text-gray-500">Support Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-gray-400">Live · {CONVOS.length} sessions today</span>
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold">A</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 mb-6 bg-gray-900 rounded-xl border border-gray-800 p-1 w-fit">
          {TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setSearch(""); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total Conversations" value="284" sub="All time" trend="+18%" icon={<Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={18} />} color={C.indigo} />
              <StatCard label="Leads Captured" value="47" sub="This week" trend="+12%" icon={<Ic d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" size={18} />} color={C.emerald} />
              <StatCard label="Escalation Rate" value="14%" sub="Below 20% target" trend="-3%" icon={<Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" size={18} />} color={C.amber} />
              <StatCard label="FAQ Resolution" value="62%" sub="Automated answers" trend="+5%" icon={<Ic d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" size={18} />} color={C.violet} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2"><MiniChart /></div>
              <DonutChart />
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <p className="font-semibold text-white text-sm">Recent Activity</p>
                <button onClick={() => setTab("Conversations")} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View all →</button>
              </div>
              <div className="divide-y divide-gray-800">
                {CONVOS.slice(0, 6).map((c) => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-800/50 cursor-pointer transition-colors" onClick={() => setSelectedConvo(c)}>
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{c.preview}</p>
                      <p className="text-xs text-gray-500">{c.id} · {c.messages} messages</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.escalated && <Badge label="Escalated" color="amber" />}
                      {c.lead && <Badge label="Lead" color="emerald" />}
                      <span className="text-xs text-gray-500">{fmtDate(c.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CONVERSATIONS ── */}
        {tab === "Conversations" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-52">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Ic d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" size={15} /></span>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sessions or messages…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <button onClick={() => setFilterEsc((v) => !v)}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-2 ${filterEsc ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                <Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" size={14} /> Escalated
              </button>
              <button onClick={() => setFilterLead((v) => !v)}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-2 ${filterLead ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                <Ic d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" size={14} /> Has Lead
              </button>
              <span className="text-xs text-gray-500 ml-auto">{filteredConvos.length} results</span>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    {["Session", "Preview", "Messages", "Source", "Badges", "Time", ""].map((h) => (
                      <th key={h} className="text-xs font-semibold text-gray-400 text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredConvos.map((c) => (
                    <tr key={c.id} className="hover:bg-indigo-600/5 transition-colors cursor-pointer" onClick={() => setSelectedConvo(c)}>
                      <td className="px-4 py-3.5 text-xs font-mono text-indigo-400 font-medium">{c.id}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-300 max-w-xs truncate">{c.preview}</td>
                      <td className="px-4 py-3.5 text-sm text-center text-gray-400">{c.messages}</td>
                      <td className="px-4 py-3.5"><Badge label={c.source} color={c.source === "faq" ? "emerald" : c.source === "llm" ? "indigo" : "sky"} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5">
                          {c.escalated && <Badge label="🚨 Esc" color="amber" />}
                          {c.lead && <Badge label="✓ Lead" color="emerald" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(c.date)}</td>
                      <td className="px-4 py-3.5"><span className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View →</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredConvos.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No conversations match your filters</div>}
            </div>
          </div>
        )}

        {/* ── LEADS ── */}
        {tab === "Leads" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 min-w-52">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Ic d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" size={15} /></span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <button onClick={exportCSV} className="px-4 py-2.5 bg-gray-900 border border-gray-700 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-800 flex items-center gap-2 transition-colors">
                <Ic d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={14} /> Export CSV
              </button>
              <span className="text-xs text-gray-500">{filteredLeads.length} leads</span>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    {["Name", "Email", "Intent", "Status", "Session", "Captured", ""].map((h) => (
                      <th key={h} className="text-xs font-semibold text-gray-400 text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredLeads.map((l) => {
                    const st = leadStatus[l.id] || l.status;
                    return (
                      <tr key={l.id} className="hover:bg-emerald-500/5 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">{l.name[0]}</div>
                            <span className="text-sm font-medium text-gray-200">{l.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-400">{l.email}</td>
                        <td className="px-4 py-3.5"><Badge label={l.intent} color={l.intent === "Pricing" ? "indigo" : l.intent === "Demo" ? "violet" : l.intent === "Enterprise" ? "rose" : "sky"} /></td>
                        <td className="px-4 py-3.5">
                          <select value={st} onChange={(e) => setLeadStatus((s) => ({ ...s, [l.id]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer">
                            {["new", "contacted", "qualified", "closed"].map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-indigo-400">{l.sessionId}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(l.date)}</td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => showToast(`Email drafted for ${l.name}`)}
                            className="text-xs bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-indigo-600/30 font-medium transition-colors">Contact</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FAQ MANAGER ── */}
        {tab === "FAQ Manager" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-400">{faqs.filter((f) => f.active).length} active · {faqs.filter((f) => !f.active).length} inactive</p>
                <Badge label={`${faqs.reduce((a, f) => a + f.hits, 0)} total hits`} color="indigo" />
              </div>
              <button onClick={() => setFaqModal("new")}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 transition-colors">
                <Ic d="M12 5v14M5 12h14" size={15} sw={2.5} /> Add FAQ
              </button>
            </div>
            <div className="grid gap-3">
              {faqs.map((f) => (
                <div key={f.id} className={`bg-gray-900 rounded-2xl border p-4 transition-all ${f.active ? "border-gray-800" : "border-gray-800 opacity-50"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-white">{f.q}</p>
                        {f.tags.map((t) => (
                          <span key={t} className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{f.a}</p>
                      <p className="text-xs text-indigo-400 font-medium mt-2">↑ {f.hits} hits this month</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleFAQ(f.id)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${f.active ? "bg-indigo-600" : "bg-gray-700"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${f.active ? "left-4" : "left-0.5"}`} />
                      </button>
                      <button onClick={() => setFaqModal(f)}
                        className="w-8 h-8 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-600/10 flex items-center justify-center transition-colors">
                        <Ic d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={14} />
                      </button>
                      <button onClick={() => deleteFAQ(f.id)}
                        className="w-8 h-8 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors">
                        <Ic d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedConvo && <TranscriptModal convo={selectedConvo} onClose={() => setSelectedConvo(null)} />}
      {faqModal && <FAQModal faq={faqModal === "new" ? null : faqModal as FAQ} onSave={saveFAQ} onClose={() => setFaqModal(null)} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 border border-gray-700 text-white text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-2"
          style={{ animation: "fadeUp .2s ease" }}>
          <Ic d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" size={15} /> {toast}
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
    </div>
  );
}
