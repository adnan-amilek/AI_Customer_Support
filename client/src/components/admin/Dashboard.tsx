import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/client";

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

// ── Clarix nav logo (item.svg) ────────────────────────────────────────────────
const ClarixNavLogo = () => (
  <svg width="91" height="28" viewBox="0 0 91 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" fill="#1B1C22"/>
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" stroke="#363843"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0001 21.9618C19.7374 21.9618 21.9575 19.7419 21.9575 17.0044C21.9575 14.2669 19.7374 12.0469 17.0001 12.0469C14.2626 12.0469 12.0426 14.2669 12.0426 17.0044C12.0426 17.6652 12.172 18.2957 12.4067 18.8722C12.5146 19.1374 12.6449 19.3911 12.7951 19.631L12.4227 20.3436L11.709 21.7102L11.7091 21.7109L13.3612 21.3469L14.2744 21.1457C15.0565 21.6614 15.9934 21.9618 17.0001 21.9618Z" fill="#1B1C22"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0007 21.963C15.994 21.963 15.0573 21.6626 14.2752 21.1468L13.3619 21.3481L11.7251 21.7086C12.3149 22.369 13.0267 22.9181 13.8252 23.3202C14.7801 23.8011 15.8589 24.072 17.0008 24.072C19.0316 24.072 20.8626 24.9285 22.1524 26.2998C21.9988 25.0502 21.3795 23.9445 20.4735 23.1616C22.6215 21.9479 24.072 19.6434 24.072 17.0008C24.072 13.0962 20.9054 9.92969 17.0008 9.92969C13.0962 9.92969 9.92969 13.0962 9.92969 17.0008C9.92969 18.8039 10.6049 20.4496 11.7163 21.6988L12.4235 20.3447L12.7958 19.6321C12.6457 19.3922 12.5154 19.1385 12.4074 18.8733C12.1727 18.2969 12.0433 17.6663 12.0433 17.0055C12.0433 14.391 14.0685 12.2484 16.6353 12.0613C16.756 12.0525 16.8779 12.048 17.0008 12.048C17.128 12.048 17.2541 12.0528 17.3789 12.0622C19.9398 12.2554 21.9583 14.3953 21.9583 17.0055C21.9583 19.6638 19.8648 21.8341 17.2371 21.9574C17.1586 21.9611 17.08 21.963 17.0008 21.963Z" fill="url(#navGrad0)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M20.4735 23.1615C19.6054 22.4113 18.4741 21.9575 17.2371 21.9574C19.8648 21.8341 21.9583 19.6638 21.9583 17.0055C21.9583 14.3953 19.9397 12.2554 17.3789 12.0622C17.2541 12.0528 17.128 12.048 17.0008 12.048C16.8778 12.048 16.756 12.0525 16.6352 12.0613C14.0684 12.2484 12.0433 14.391 12.0433 17.0055C12.0433 17.6663 12.1727 18.2969 12.4074 18.8733C12.5153 19.1385 12.6456 19.3922 12.7958 19.6321L12.4234 20.3447L11.7163 21.6988C10.6049 20.4496 9.92969 18.8039 9.92969 17.0008C9.92969 13.0962 13.0962 9.92969 17.0008 9.92969C20.9054 9.92969 24.072 13.0962 24.072 17.0008C24.072 19.6434 22.6215 21.9479 20.4735 23.1615Z" fill="url(#navGrad1)"/>
    <path d="M54.3111 14.6662H52.3168C52.2401 14.2401 52.0973 13.8651 51.8885 13.5412C51.6797 13.2173 51.424 12.9425 51.1214 12.7166C50.8189 12.4908 50.4801 12.3203 50.1051 12.2053C49.7344 12.0902 49.3402 12.0327 48.9226 12.0327C48.1683 12.0327 47.4929 12.2223 46.8963 12.6016C46.304 12.9808 45.8352 13.5369 45.4901 14.2699C45.1491 15.0028 44.9787 15.8977 44.9787 16.9545C44.9787 18.0199 45.1491 18.919 45.4901 19.652C45.8352 20.3849 46.3061 20.9389 46.9027 21.3139C47.4993 21.6889 48.1705 21.8764 48.9162 21.8764C49.3295 21.8764 49.7216 21.821 50.0923 21.7102C50.4673 21.5952 50.8061 21.4268 51.1087 21.2053C51.4112 20.9837 51.6669 20.7131 51.8757 20.3935C52.0888 20.0696 52.2358 19.6989 52.3168 19.2812L54.3111 19.2876C54.2045 19.9311 53.9979 20.5234 53.6911 21.0646C53.3885 21.6016 52.9986 22.0661 52.5213 22.4581C52.0483 22.8459 51.5071 23.1463 50.8977 23.3594C50.2884 23.5724 49.6236 23.679 48.9034 23.679C47.7699 23.679 46.7599 23.4105 45.8736 22.8736C44.9872 22.3324 44.2884 21.5589 43.777 20.5533C43.2699 19.5476 43.0163 18.348 43.0163 16.9545C43.0163 15.5568 43.272 14.3572 43.7834 13.3558C44.2947 12.3501 44.9936 11.5788 45.88 11.0419C46.7663 10.5007 47.7741 10.2301 48.9034 10.2301C49.598 10.2301 50.2457 10.3303 50.8466 10.5305C51.4517 10.7266 51.995 11.0163 52.4766 11.3999C52.9581 11.7791 53.3565 12.2436 53.6719 12.7933C53.9872 13.3388 54.2003 13.9631 54.3111 14.6662ZM58.2524 10.4091V23.5H56.3411V10.4091H58.2524ZM63.5008 23.7173C62.8786 23.7173 62.3161 23.6023 61.8133 23.3722C61.3105 23.1378 60.912 22.799 60.618 22.3558C60.3282 21.9126 60.1833 21.3693 60.1833 20.7259C60.1833 20.1719 60.2899 19.7159 60.5029 19.358C60.716 19 61.0036 18.7166 61.3659 18.5078C61.7281 18.299 62.1329 18.1413 62.5803 18.0348C63.0278 17.9283 63.4837 17.8473 63.9482 17.7919C64.5363 17.7237 65.0136 17.6683 65.3801 17.6257C65.7465 17.5788 66.0129 17.5043 66.1791 17.402C66.3453 17.2997 66.4284 17.1335 66.4284 16.9034V16.8587C66.4284 16.3004 66.2707 15.8679 65.9553 15.5611C65.6443 15.2543 65.1798 15.1009 64.5619 15.1009C63.9184 15.1009 63.4113 15.2436 63.0406 15.5291C62.6741 15.8104 62.4205 16.1236 62.2799 16.4688L60.4837 16.0597C60.6968 15.4631 61.0079 14.9815 61.417 14.6151C61.8303 14.2443 62.3055 13.9759 62.8424 13.8097C63.3793 13.6392 63.944 13.554 64.5363 13.554C64.9284 13.554 65.3438 13.6009 65.7828 13.6946C66.2259 13.7841 66.6393 13.9503 67.0228 14.1932C67.4106 14.4361 67.7281 14.7834 67.9752 15.2351C68.2224 15.6825 68.346 16.2642 68.346 16.9801V23.5H66.4795V22.1577H66.4028C66.2792 22.4048 66.0938 22.6477 65.8467 22.8864C65.5995 23.125 65.282 23.3232 64.8943 23.4808C64.5065 23.6385 64.042 23.7173 63.5008 23.7173ZM63.9163 22.1832C64.4447 22.1832 64.8964 22.0788 65.2714 21.87C65.6507 21.6612 65.9383 21.3885 66.1343 21.0518C66.3346 20.7109 66.4347 20.3466 66.4347 19.9588V18.6932C66.3666 18.7614 66.2345 18.8253 66.0384 18.8849C65.8467 18.9403 65.6272 18.9893 65.3801 19.032C65.1329 19.0703 64.8921 19.1065 64.6578 19.1406C64.4234 19.1705 64.2274 19.196 64.0697 19.2173C63.6989 19.2642 63.3602 19.343 63.0534 19.4538C62.7508 19.5646 62.5079 19.7244 62.3247 19.9332C62.1457 20.1378 62.0562 20.4105 62.0562 20.7514C62.0562 21.2244 62.2309 21.5824 62.5803 21.8253C62.9298 22.0639 63.3751 22.1832 63.9163 22.1832ZM70.7116 23.5V13.6818H72.5589V15.2415H72.6612C72.8401 14.7131 73.1555 14.2976 73.6072 13.995C74.0632 13.6882 74.5788 13.5348 75.1541 13.5348C75.2734 13.5348 75.414 13.5391 75.5759 13.5476C75.7421 13.5561 75.8721 13.5668 75.9659 13.5795V15.4077C75.8892 15.3864 75.7528 15.3629 75.5568 15.3374C75.3607 15.3075 75.1647 15.2926 74.9687 15.2926C74.517 15.2926 74.1143 15.3885 73.7606 15.5803C73.4112 15.7678 73.1342 16.0298 72.9296 16.3665C72.7251 16.6989 72.6228 17.0781 72.6228 17.5043V23.5H70.7116ZM77.4398 23.5V13.6818H79.351V23.5H77.4398ZM78.405 12.1669C78.0726 12.1669 77.7871 12.0561 77.5485 11.8345C77.3141 11.6087 77.1969 11.3402 77.1969 11.0291C77.1969 10.7138 77.3141 10.4453 77.5485 10.2237C77.7871 9.99787 78.0726 9.88494 78.405 9.88494C78.7374 9.88494 79.0208 9.99787 79.2551 10.2237C79.4938 10.4453 79.6131 10.7138 79.6131 11.0291C79.6131 11.3402 79.4938 11.6087 79.2551 11.8345C79.0208 12.0561 78.7374 12.1669 78.405 12.1669ZM83.2507 13.6818L85.4176 17.5043L87.6037 13.6818H89.6939L86.6321 18.5909L89.7195 23.5H87.6293L85.4176 19.831L83.2124 23.5H81.1158L84.1712 18.5909L81.1542 13.6818H83.2507Z" fill="white"/>
    <defs>
      <linearGradient id="navGrad0" x1="20.8251" y1="11.0239" x2="13.3091" y2="26.4338" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
      <linearGradient id="navGrad1" x1="24.0236" y1="3.21779" x2="-15.875" y2="81.5231" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
    </defs>
  </svg>
);

// ── API types ─────────────────────────────────────────────────────────────────
interface ApiConvo {
  id: string;
  session_id: string;
  started_at: string;
  escalated: boolean;
  escalated_at: string | null;
  metadata: Record<string, unknown>;
  messages?: Array<{ role: string; content: string; source?: string; created_at?: string }>;
}
interface ApiLead {
  id: string;
  conversation_id: string;
  name: string;
  email: string;
  submitted_at: string;
  enriched_data?: Record<string, unknown>;
}
interface ApiFAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}
interface Analytics {
  totalConversations: number;
  totalLeads: number;
  escalationRate: string;
  faqResolutionRate: string;
}

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

const DonutChart = ({ faqPct, escPct }: { faqPct: number; escPct: number }) => {
  const aiPct = Math.max(0, 100 - faqPct - escPct);
  const segs = [
    { label: "FAQ Match", pct: faqPct, color: C.emerald },
    { label: "AI (LLM)",  pct: aiPct,  color: C.indigo },
    { label: "Escalated", pct: escPct, color: C.amber },
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
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="#9ca3af">Sources</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#f9fafb">{faqPct}%</text>
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

// ── Transcript Modal ───────────────────────────────────────────────────────────
const TranscriptModal = ({ sessionId, onClose }: { sessionId: string; onClose: () => void }) => {
  const [data, setData] = useState<ApiConvo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/conversations/${sessionId}`)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <p className="font-semibold text-white text-sm">Session {sessionId}</p>
            {data && <p className="text-xs text-gray-500">{fmtDate(data.started_at)}</p>}
          </div>
          <div className="flex items-center gap-2">
            {data?.escalated && <Badge label="Escalated" color="amber" />}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 ml-2">
              <Ic d="M18 6L6 18M6 6l12 12" />
            </button>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-3 max-h-80 overflow-y-auto">
          {loading && <p className="text-center text-gray-500 text-sm py-4">Loading transcript…</p>}
          {!loading && (!data?.messages || data.messages.length === 0) && (
            <p className="text-center text-gray-500 text-sm py-4">No messages found</p>
          )}
          {data?.messages?.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-200 rounded-bl-sm"}`}>
                {m.content}
                {m.source && <span className="block text-[10px] mt-1 opacity-60">{m.source === "faq" ? "✓ FAQ" : "✦ AI"}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── FAQ Modal ─────────────────────────────────────────────────────────────────
const FAQModal = ({ faq, onSave, onClose }: {
  faq: ApiFAQ | null;
  onSave: (data: { question: string; answer: string; tags: string[] }) => void;
  onClose: () => void;
}) => {
  const [q, setQ]       = useState(faq?.question || "");
  const [a, setA]       = useState(faq?.answer || "");
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
          <button onClick={() => { if (q && a) onSave({ question: q, answer: a, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }); }}
            className="px-5 py-2 text-sm text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 font-medium transition-colors">
            {faq ? "Save Changes" : "Add FAQ"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = ({ cols }: { cols: number }) => (
  <tr className="border-b border-gray-800">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className="h-3 bg-gray-800 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
      </td>
    ))}
  </tr>
);

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS = ["Overview", "Conversations", "Leads", "FAQ Manager"];

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab,      setTab]      = useState("Overview");
  const [search,   setSearch]   = useState("");
  const [filterEsc, setFilterEsc] = useState(false);

  // ── data state ────────────────────────────────────────────────────────────
  const [analytics,  setAnalytics]  = useState<Analytics | null>(null);
  const [liveCount,  setLiveCount]  = useState(0);
  const [convos,     setConvos]     = useState<ApiConvo[]>([]);
  const [leads,      setLeads]      = useState<ApiLead[]>([]);
  const [faqs,       setFaqs]       = useState<ApiFAQ[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [faqModal,  setFaqModal]   = useState<null | "new" | ApiFAQ>(null);
  const [leadStatus, setLeadStatus] = useState<Record<string, string>>({});
  const [toast,    setToast]       = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // ── API fetch helpers ─────────────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ana, stats] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/stats"),
      ]);
      setAnalytics(ana.data);
      setLiveCount(stats.data.sessions ?? 0);
    } catch { /* keep previous */ }
    finally { setLoadingData(false); }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoadingData(true);
    try {
      const params: Record<string, string> = { limit: "50" };
      if (filterEsc) params.escalated = "true";
      const { data } = await api.get("/admin/conversations", { params });
      setConvos(data.data ?? []);
      setLiveCount(data.total ?? 0);
    } catch { setConvos([]); }
    finally { setLoadingData(false); }
  }, [filterEsc]);

  const fetchLeads = useCallback(async () => {
    setLoadingData(true);
    try {
      const { data } = await api.get("/admin/leads", { params: { limit: "100" } });
      setLeads(data.data ?? []);
    } catch { setLeads([]); }
    finally { setLoadingData(false); }
  }, []);

  const fetchFAQs = useCallback(async () => {
    setLoadingData(true);
    try {
      const { data } = await api.get("/admin/faqs");
      setFaqs(Array.isArray(data) ? data : []);
    } catch { setFaqs([]); }
    finally { setLoadingData(false); }
  }, []);

  // ── Fetch on tab/filter change ────────────────────────────────────────────
  useEffect(() => {
    if (tab === "Overview")        fetchOverview();
    else if (tab === "Conversations") fetchConversations();
    else if (tab === "Leads")      fetchLeads();
    else if (tab === "FAQ Manager") fetchFAQs();
  }, [tab, fetchOverview, fetchConversations, fetchLeads, fetchFAQs]);

  useEffect(() => {
    if (tab === "Conversations") fetchConversations();
  }, [filterEsc, tab, fetchConversations]);

  // ── Client-side filter for search ─────────────────────────────────────────
  const filteredConvos = useMemo(() =>
    convos.filter((c) => !search || c.session_id.includes(search)),
    [convos, search]
  );

  const filteredLeads = useMemo(() =>
    leads.filter((l) =>
      !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.includes(search)
    ),
    [leads, search]
  );

  // ── FAQ CRUD ──────────────────────────────────────────────────────────────
  const saveFAQ = async (formData: { question: string; answer: string; tags: string[] }) => {
    try {
      if (faqModal === "new") {
        const { data } = await api.post("/admin/faqs", { ...formData, active: true });
        setFaqs((f) => [data, ...f]);
        showToast("FAQ added successfully");
      } else if (faqModal) {
        const { data } = await api.put(`/admin/faqs/${(faqModal as ApiFAQ).id}`, formData);
        setFaqs((f) => f.map((x) => x.id === (faqModal as ApiFAQ).id ? data : x));
        showToast("FAQ updated");
      }
    } catch { showToast("Failed to save FAQ"); }
    setFaqModal(null);
  };

  const toggleFAQ = async (id: string) => {
    try {
      const { data } = await api.patch(`/admin/faqs/${id}/toggle`);
      setFaqs((f) => f.map((x) => x.id === id ? data : x));
    } catch { showToast("Failed to toggle FAQ"); }
  };

  const deleteFAQ = async (id: string) => {
    try {
      await api.delete(`/admin/faqs/${id}`);
      setFaqs((f) => f.filter((x) => x.id !== id));
      showToast("FAQ deleted");
    } catch { showToast("Failed to delete FAQ"); }
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Date"],
      ...leads.map((l) => [l.name, l.email, new Date(l.submitted_at).toLocaleDateString()])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv]));
    a.download = "leads.csv"; a.click();
    showToast("CSV exported!");
  };

  // ── Overview stat helpers ─────────────────────────────────────────────────
  const totalConvos   = analytics?.totalConversations ?? 0;
  const totalLeadsN   = analytics?.totalLeads ?? 0;
  const escRate       = analytics?.escalationRate ?? "0%";
  const faqRate       = analytics?.faqResolutionRate ?? "0%";
  const faqPct        = parseInt(faqRate) || 0;
  const escPct        = parseInt(escRate) || 0;

  return (
    <div className="min-h-screen bg-gray-950 font-sans">
      {/* ── Top Nav ── */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <ClarixNavLogo />
          <span className="text-gray-700">|</span>
          <span className="text-xs text-gray-500">Support Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs text-gray-400">Live · {liveCount} sessions today</span>
          </div>
          <button
            onClick={onSignOut}
            className="text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-colors rounded-lg px-3 py-1.5 flex items-center gap-1.5"
          >
            <Ic d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={13} />
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* ── Tab Bar ── */}
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
              <StatCard label="Total Conversations" value={totalConvos} sub="All time"
                icon={<Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={18} />} color={C.indigo} />
              <StatCard label="Leads Captured" value={totalLeadsN} sub="All time"
                icon={<Ic d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" size={18} />} color={C.emerald} />
              <StatCard label="Escalation Rate" value={escRate} sub="Target < 20%"
                icon={<Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" size={18} />} color={C.amber} />
              <StatCard label="FAQ Resolution" value={faqRate} sub="Automated answers"
                icon={<Ic d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" size={18} />} color={C.violet} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2"><MiniChart /></div>
              <DonutChart faqPct={faqPct} escPct={escPct} />
            </div>
            {/* Recent Activity */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <p className="font-semibold text-white text-sm">Recent Activity</p>
                <button onClick={() => setTab("Conversations")} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View all →</button>
              </div>
              {loadingData ? (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">Loading…</div>
              ) : convos.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">No conversations yet</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {convos.slice(0, 6).map((c) => (
                    <div key={c.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-800/50 cursor-pointer transition-colors" onClick={() => setSelectedSession(c.session_id)}>
                      <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 font-mono truncate">{c.session_id}</p>
                        <p className="text-xs text-gray-500">{fmtDate(c.started_at)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.escalated && <Badge label="Escalated" color="amber" />}
                        <span className="text-xs text-gray-500">{fmtDate(c.started_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  placeholder="Search by session ID…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <button onClick={() => setFilterEsc((v) => !v)}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-2 ${filterEsc ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                <Ic d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" size={14} /> Escalated
              </button>
              <button onClick={fetchConversations} className="px-3.5 py-2.5 rounded-xl text-sm border bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors flex items-center gap-2">
                <Ic d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" size={14} /> Refresh
              </button>
              <span className="text-xs text-gray-500 ml-auto">{filteredConvos.length} results</span>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    {["Session", "Started", "Status", "Time", ""].map((h) => (
                      <th key={h} className="text-xs font-semibold text-gray-400 text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loadingData && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
                  {!loadingData && filteredConvos.map((c) => (
                    <tr key={c.id} className="hover:bg-indigo-600/5 transition-colors cursor-pointer" onClick={() => setSelectedSession(c.session_id)}>
                      <td className="px-4 py-3.5 text-xs font-mono text-indigo-400 font-medium">{c.session_id}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-400">{new Date(c.started_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5">
                          {c.escalated ? <Badge label="🚨 Escalated" color="amber" /> : <Badge label="Active" color="emerald" />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(c.started_at)}</td>
                      <td className="px-4 py-3.5"><span className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View →</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loadingData && filteredConvos.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No conversations found</div>}
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
                    {["Name", "Email", "Status", "Session", "Captured", ""].map((h) => (
                      <th key={h} className="text-xs font-semibold text-gray-400 text-left px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loadingData && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
                  {!loadingData && filteredLeads.map((l) => {
                    const st = leadStatus[l.id] || "new";
                    return (
                      <tr key={l.id} className="hover:bg-emerald-500/5 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">{l.name[0]}</div>
                            <span className="text-sm font-medium text-gray-200">{l.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-400">{l.email}</td>
                        <td className="px-4 py-3.5">
                          <select value={st} onChange={(e) => setLeadStatus((s) => ({ ...s, [l.id]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer">
                            {["new", "contacted", "qualified", "closed"].map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-indigo-400">{l.conversation_id.slice(0, 8)}…</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(l.submitted_at)}</td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => showToast(`Email drafted for ${l.name}`)}
                            className="text-xs bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-indigo-600/30 font-medium transition-colors">Contact</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!loadingData && filteredLeads.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">No leads yet</div>}
            </div>
          </div>
        )}

        {/* ── FAQ MANAGER ── */}
        {tab === "FAQ Manager" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-400">{faqs.filter((f) => f.active).length} active · {faqs.filter((f) => !f.active).length} inactive</p>
                <Badge label={`${faqs.length} FAQs`} color="indigo" />
              </div>
              <button onClick={() => setFaqModal("new")}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 transition-colors">
                <Ic d="M12 5v14M5 12h14" size={15} sw={2.5} /> Add FAQ
              </button>
            </div>
            {loadingData && (
              <div className="text-center py-12 text-gray-500 text-sm">Loading FAQs…</div>
            )}
            <div className="grid gap-3">
              {faqs.map((f) => (
                <div key={f.id} className={`bg-gray-900 rounded-2xl border p-4 transition-all ${f.active ? "border-gray-800" : "border-gray-800 opacity-50"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-white">{f.question}</p>
                        {f.tags?.map((t) => (
                          <span key={t} className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{f.answer}</p>
                      <p className="text-xs text-gray-600 mt-2">Updated {fmtDate(f.updated_at)}</p>
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

      {/* ── Modals ── */}
      {selectedSession && <TranscriptModal sessionId={selectedSession} onClose={() => setSelectedSession(null)} />}
      {faqModal && <FAQModal faq={faqModal === "new" ? null : faqModal as ApiFAQ} onSave={saveFAQ} onClose={() => setFaqModal(null)} />}

      {/* ── Toast ── */}
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
