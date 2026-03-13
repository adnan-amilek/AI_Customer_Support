import { useState, useRef, useEffect } from "react";

// ── Session ID ────────────────────────────────────────────────────────────────
const SESSION_KEY = "ai_support_session_id";
function makeSessionId(): string {
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}
function getOrCreateSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) ?? makeSessionId();
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  source?: string | null;
}
interface Settings {
  faqs: boolean;
  leads: boolean;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", strokeWidth = 2 }: {
  d: string; size?: number; stroke?: string; fill?: string; strokeWidth?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const SendIcon  = () => <Icon d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" size={16} />;
const UserIcon  = () => <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" size={14} />;
const PlusIcon  = () => <Icon d="M12 5v14M5 12h14" size={13} strokeWidth={2.5} />;
const MenuIcon  = () => <Icon d="M3 12h18M3 6h18M3 18h18" size={18} />;
const CloseIcon = () => <Icon d="M18 6L6 18M6 6l12 12" size={18} />;

// ── Clarix brand logo (item.svg) ──────────────────────────────────────────────
const ClarixLogo = () => (
  <svg width="91" height="34" viewBox="0 0 91 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" fill="#1B1C22"/>
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" stroke="#363843"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0001 21.9618C19.7374 21.9618 21.9575 19.7419 21.9575 17.0044C21.9575 14.2669 19.7374 12.0469 17.0001 12.0469C14.2626 12.0469 12.0426 14.2669 12.0426 17.0044C12.0426 17.6652 12.172 18.2957 12.4067 18.8722C12.5146 19.1374 12.6449 19.3911 12.7951 19.631L12.4227 20.3436L11.709 21.7102L11.7091 21.7109L13.3612 21.3469L14.2744 21.1457C15.0565 21.6614 15.9934 21.9618 17.0001 21.9618Z" fill="#1B1C22"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0007 21.963C15.994 21.963 15.0573 21.6626 14.2752 21.1468L13.3619 21.3481L11.7251 21.7086C12.3149 22.369 13.0267 22.9181 13.8252 23.3202C14.7801 23.8011 15.8589 24.072 17.0008 24.072C19.0316 24.072 20.8626 24.9285 22.1524 26.2998C21.9988 25.0502 21.3795 23.9445 20.4735 23.1616C22.6215 21.9479 24.072 19.6434 24.072 17.0008C24.072 13.0962 20.9054 9.92969 17.0008 9.92969C13.0962 9.92969 9.92969 13.0962 9.92969 17.0008C9.92969 18.8039 10.6049 20.4496 11.7163 21.6988L12.4235 20.3447L12.7958 19.6321C12.6457 19.3922 12.5154 19.1385 12.4074 18.8733C12.1727 18.2969 12.0433 17.6663 12.0433 17.0055C12.0433 14.391 14.0685 12.2484 16.6353 12.0613C16.756 12.0525 16.8779 12.048 17.0008 12.048C17.128 12.048 17.2541 12.0528 17.3789 12.0622C19.9398 12.2554 21.9583 14.3953 21.9583 17.0055C21.9583 19.6638 19.8648 21.8341 17.2371 21.9574C17.1586 21.9611 17.08 21.963 17.0008 21.963Z" fill="url(#clarixGrad0)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M20.4735 23.1615C19.6054 22.4113 18.4741 21.9575 17.2371 21.9574C19.8648 21.8341 21.9583 19.6638 21.9583 17.0055C21.9583 14.3953 19.9397 12.2554 17.3789 12.0622C17.2541 12.0528 17.128 12.048 17.0008 12.048C16.8778 12.048 16.756 12.0525 16.6352 12.0613C14.0684 12.2484 12.0433 14.391 12.0433 17.0055C12.0433 17.6663 12.1727 18.2969 12.4074 18.8733C12.5153 19.1385 12.6456 19.3922 12.7958 19.6321L12.4234 20.3447L11.7163 21.6988C10.6049 20.4496 9.92969 18.8039 9.92969 17.0008C9.92969 13.0962 13.0962 9.92969 17.0008 9.92969C20.9054 9.92969 24.072 13.0962 24.072 17.0008C24.072 19.6434 22.6215 21.9479 20.4735 23.1615Z" fill="url(#clarixGrad1)"/>
    <path d="M54.3111 14.6662H52.3168C52.2401 14.2401 52.0973 13.8651 51.8885 13.5412C51.6797 13.2173 51.424 12.9425 51.1214 12.7166C50.8189 12.4908 50.4801 12.3203 50.1051 12.2053C49.7344 12.0902 49.3402 12.0327 48.9226 12.0327C48.1683 12.0327 47.4929 12.2223 46.8963 12.6016C46.304 12.9808 45.8352 13.5369 45.4901 14.2699C45.1491 15.0028 44.9787 15.8977 44.9787 16.9545C44.9787 18.0199 45.1491 18.919 45.4901 19.652C45.8352 20.3849 46.3061 20.9389 46.9027 21.3139C47.4993 21.6889 48.1705 21.8764 48.9162 21.8764C49.3295 21.8764 49.7216 21.821 50.0923 21.7102C50.4673 21.5952 50.8061 21.4268 51.1087 21.2053C51.4112 20.9837 51.6669 20.7131 51.8757 20.3935C52.0888 20.0696 52.2358 19.6989 52.3168 19.2812L54.3111 19.2876C54.2045 19.9311 53.9979 20.5234 53.6911 21.0646C53.3885 21.6016 52.9986 22.0661 52.5213 22.4581C52.0483 22.8459 51.5071 23.1463 50.8977 23.3594C50.2884 23.5724 49.6236 23.679 48.9034 23.679C47.7699 23.679 46.7599 23.4105 45.8736 22.8736C44.9872 22.3324 44.2884 21.5589 43.777 20.5533C43.2699 19.5476 43.0163 18.348 43.0163 16.9545C43.0163 15.5568 43.272 14.3572 43.7834 13.3558C44.2947 12.3501 44.9936 11.5788 45.88 11.0419C46.7663 10.5007 47.7741 10.2301 48.9034 10.2301C49.598 10.2301 50.2457 10.3303 50.8466 10.5305C51.4517 10.7266 51.995 11.0163 52.4766 11.3999C52.9581 11.7791 53.3565 12.2436 53.6719 12.7933C53.9872 13.3388 54.2003 13.9631 54.3111 14.6662ZM58.2524 10.4091V23.5H56.3411V10.4091H58.2524ZM63.5008 23.7173C62.8786 23.7173 62.3161 23.6023 61.8133 23.3722C61.3105 23.1378 60.912 22.799 60.618 22.3558C60.3282 21.9126 60.1833 21.3693 60.1833 20.7259C60.1833 20.1719 60.2899 19.7159 60.5029 19.358C60.716 19 61.0036 18.7166 61.3659 18.5078C61.7281 18.299 62.1329 18.1413 62.5803 18.0348C63.0278 17.9283 63.4837 17.8473 63.9482 17.7919C64.5363 17.7237 65.0136 17.6683 65.3801 17.6257C65.7465 17.5788 66.0129 17.5043 66.1791 17.402C66.3453 17.2997 66.4284 17.1335 66.4284 16.9034V16.8587C66.4284 16.3004 66.2707 15.8679 65.9553 15.5611C65.6443 15.2543 65.1798 15.1009 64.5619 15.1009C63.9184 15.1009 63.4113 15.2436 63.0406 15.5291C62.6741 15.8104 62.4205 16.1236 62.2799 16.4688L60.4837 16.0597C60.6968 15.4631 61.0079 14.9815 61.417 14.6151C61.8303 14.2443 62.3055 13.9759 62.8424 13.8097C63.3793 13.6392 63.944 13.554 64.5363 13.554C64.9284 13.554 65.3438 13.6009 65.7828 13.6946C66.2259 13.7841 66.6393 13.9503 67.0228 14.1932C67.4106 14.4361 67.7281 14.7834 67.9752 15.2351C68.2224 15.6825 68.346 16.2642 68.346 16.9801V23.5H66.4795V22.1577H66.4028C66.2792 22.4048 66.0938 22.6477 65.8467 22.8864C65.5995 23.125 65.282 23.3232 64.8943 23.4808C64.5065 23.6385 64.042 23.7173 63.5008 23.7173ZM63.9163 22.1832C64.4447 22.1832 64.8964 22.0788 65.2714 21.87C65.6507 21.6612 65.9383 21.3885 66.1343 21.0518C66.3346 20.7109 66.4347 20.3466 66.4347 19.9588V18.6932C66.3666 18.7614 66.2345 18.8253 66.0384 18.8849C65.8467 18.9403 65.6272 18.9893 65.3801 19.032C65.1329 19.0703 64.8921 19.1065 64.6578 19.1406C64.4234 19.1705 64.2274 19.196 64.0697 19.2173C63.6989 19.2642 63.3602 19.343 63.0534 19.4538C62.7508 19.5646 62.5079 19.7244 62.3247 19.9332C62.1457 20.1378 62.0562 20.4105 62.0562 20.7514C62.0562 21.2244 62.2309 21.5824 62.5803 21.8253C62.9298 22.0639 63.3751 22.1832 63.9163 22.1832ZM70.7116 23.5V13.6818H72.5589V15.2415H72.6612C72.8401 14.7131 73.1555 14.2976 73.6072 13.995C74.0632 13.6882 74.5788 13.5348 75.1541 13.5348C75.2734 13.5348 75.414 13.5391 75.5759 13.5476C75.7421 13.5561 75.8721 13.5668 75.9659 13.5795V15.4077C75.8892 15.3864 75.7528 15.3629 75.5568 15.3374C75.3607 15.3075 75.1647 15.2926 74.9687 15.2926C74.517 15.2926 74.1143 15.3885 73.7606 15.5803C73.4112 15.7678 73.1342 16.0298 72.9296 16.3665C72.7251 16.6989 72.6228 17.0781 72.6228 17.5043V23.5H70.7116ZM77.4398 23.5V13.6818H79.351V23.5H77.4398ZM78.405 12.1669C78.0726 12.1669 77.7871 12.0561 77.5485 11.8345C77.3141 11.6087 77.1969 11.3402 77.1969 11.0291C77.1969 10.7138 77.3141 10.4453 77.5485 10.2237C77.7871 9.99787 78.0726 9.88494 78.405 9.88494C78.7374 9.88494 79.0208 9.99787 79.2551 10.2237C79.4938 10.4453 79.6131 10.7138 79.6131 11.0291C79.6131 11.3402 79.4938 11.6087 79.2551 11.8345C79.0208 12.0561 78.7374 12.1669 78.405 12.1669ZM83.2507 13.6818L85.4176 17.5043L87.6037 13.6818H89.6939L86.6321 18.5909L89.7195 23.5H87.6293L85.4176 19.831L83.2124 23.5H81.1158L84.1712 18.5909L81.1542 13.6818H83.2507Z" fill="white"/>
    <defs>
      <linearGradient id="clarixGrad0" x1="20.8251" y1="11.0239" x2="13.3091" y2="26.4338" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
      <linearGradient id="clarixGrad1" x1="24.0236" y1="3.21779" x2="-15.875" y2="81.5231" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
    </defs>
  </svg>
);

// ── Bell icon (Union.svg) ──────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.51322 0C7.59151 1.95092e-05 7.66941 0.0146932 7.74174 0.0439453C7.81403 0.0732145 7.87976 0.116863 7.9351 0.170898C7.99031 0.224874 8.03408 0.288908 8.064 0.359375C8.09393 0.429911 8.10985 0.505686 8.1099 0.582031V1.49121C9.35444 1.6107 10.5095 2.17702 11.3501 3.08105C12.1908 3.98519 12.6568 5.16259 12.6587 6.38379V6.7168C12.6785 7.79986 13.0146 8.8565 13.6294 9.76172L14.1783 10.5537C14.4041 10.8932 14.5323 11.286 14.5503 11.6904C14.5684 12.0949 14.4756 12.4971 14.2808 12.8545C14.086 13.2119 13.7966 13.5122 13.4429 13.7236C13.0892 13.935 12.6837 14.0499 12.2691 14.0566H9.63627V14.3125C9.5658 14.8146 9.31158 15.2753 8.92045 15.6084C8.5294 15.9414 8.02818 16.1249 7.50932 16.125C6.99029 16.125 6.48834 15.9415 6.09721 15.6084C5.70613 15.2753 5.45185 14.8146 5.38139 14.3125V14.0566H2.76518C2.15978 14.0566 1.579 13.8213 1.15092 13.4033C0.723027 12.9854 0.482087 12.419 0.481973 11.8281C0.484703 11.3534 0.640634 10.8912 0.927286 10.5078L1.46049 9.79297C2.21213 8.80608 2.61201 7.60578 2.59818 6.37598C2.57596 5.40982 2.85331 4.45978 3.39408 3.65039C3.93488 2.84099 4.71387 2.21023 5.62846 1.84082C6.04168 1.67995 6.4747 1.57288 6.91654 1.52246V0.582031C6.9166 0.505686 6.93252 0.429911 6.96244 0.359375C6.9924 0.288885 7.0361 0.224878 7.09135 0.170898C7.14674 0.116813 7.21234 0.0732164 7.28471 0.0439453C7.35706 0.0146901 7.43491 0 7.51322 0ZM6.57475 14.1807C6.61226 14.3974 6.72723 14.5942 6.89897 14.7363C7.07067 14.8784 7.28819 14.9564 7.51322 14.957C7.73904 14.9596 7.95807 14.8827 8.13041 14.7402C8.30282 14.5976 8.41724 14.3988 8.4517 14.1807V14.0566H6.57475V14.1807ZM7.6558 2.64062C7.1113 2.63776 6.57144 2.73788 6.06596 2.93555C5.38366 3.21333 4.80149 3.68454 4.39604 4.28809C3.99074 4.8915 3.7798 5.59976 3.79057 6.32129C3.82514 7.81321 3.35875 9.27565 2.46244 10.4844L1.93022 11.1982C1.77494 11.3738 1.68484 11.5964 1.67533 11.8281C1.67545 12.1102 1.79043 12.3806 1.99467 12.5801C2.199 12.7795 2.47627 12.8916 2.76518 12.8916H12.2691C12.4156 12.8917 12.561 12.8625 12.6958 12.8066C12.8306 12.7508 12.9526 12.6693 13.0542 12.5664C13.1559 12.4635 13.2353 12.3416 13.2876 12.208C13.34 12.0745 13.3642 11.932 13.3589 11.7891C13.365 11.5662 13.3013 11.3467 13.1763 11.1602L12.6431 10.3828C11.86 9.2339 11.4524 7.87995 11.4742 6.5V6.37598C11.4742 5.38661 11.0717 4.43762 10.356 3.7373C9.64028 3.03706 8.66899 2.64268 7.6558 2.64062Z" fill="#808290"/>
  </svg>
);

// ── Local FAQ Knowledge Base ───────────────────────────────────────────────────
const FAQS = [
  { q: "pricing", a: "We offer three plans:\n• **Starter** — $29/mo (up to 3 users)\n• **Pro** — $79/mo (unlimited users + analytics)\n• **Enterprise** — Custom pricing with SLA\n\nAll plans include a 14-day free trial, no credit card required." },
  { q: "demo",    a: "Absolutely! Our team offers live 30-minute demos tailored to your use case. Book directly at **demo.clarix.qa.team** or leave your email and we'll reach out within 24 hours." },
  { q: "integrations", a: "We integrate with 50+ tools including **Slack, HubSpot, Salesforce, Zapier, Google Workspace**, and more. We also offer a REST API + webhooks for custom integrations." },
  { q: "trial",   a: "Yes! Every plan starts with a **14-day free trial** — full access, no credit card required. You can upgrade, downgrade, or cancel anytime from your dashboard." },
  { q: "support", a: "We offer:\n• **Live chat** (Pro+): Mon–Fri, 9am–6pm EST\n• **Email**: clarix@qa.team (24h response)\n• **Help Center**: docs.clarix.qa.team\n• **Enterprise**: Dedicated success manager" },
  { q: "security", a: "Security is our top priority. We're **SOC 2 Type II certified**, GDPR compliant, use AES-256 encryption at rest and TLS 1.3 in transit. Hosted on AWS us-east-1 with daily backups." },
  { q: "cancel",  a: "Cancel anytime from **Settings → Billing** with one click. No fees. Your data is exportable for 30 days after cancellation." },
];

function matchLocalFAQ(input: string): string | null {
  const q = input.toLowerCase();
  const map = [
    { keys: ["pric", "cost", "plan", "subscri", "how much", "fee"],          idx: 0 },
    { keys: ["demo", "walkthrough", "tour", "show me", "see it"],            idx: 1 },
    { keys: ["integrat", "connect", "zapier", "slack", "salesforce", "api"], idx: 2 },
    { keys: ["trial", "free", "try"],                                         idx: 3 },
    { keys: ["support", "help", "contact", "reach"],                          idx: 4 },
    { keys: ["secur", "gdpr", "compli", "encrypt", "safe", "data"],          idx: 5 },
    { keys: ["cancel", "stop", "unsubscri", "refund"],                        idx: 6 },
  ];
  for (const { keys, idx } of map) {
    if (keys.some((k) => q.includes(k))) return FAQS[idx].a;
  }
  return null;
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function renderMD(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") ? <strong key={j} className="font-semibold text-white">{p.slice(2, -2)}</strong> : p
    );
    const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
    return (
      <span key={i} className={`block ${isBullet ? "pl-1" : ""} ${i > 0 && !isBullet ? "mt-1" : ""}`}>
        {parts}
      </span>
    );
  });
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-2 h-2 rounded-full bg-gray-500"
          style={{ animation: `tdB 1.2s ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes tdB{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} role="switch" aria-checked={checked}
      className={`relative inline-flex w-9 h-5 shrink-0 rounded-full transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900
        ${checked ? "bg-blue-500" : "bg-gray-700"}`}>
      <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200 self-center
        ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

// ── Inline Form Card (shown inside messages area) ──────────────────────────────
function InlineFormCard({
  title, submitLabel, onSubmit, onDismiss,
}: {
  title: string; submitLabel: string;
  onSubmit: (d: { name: string; email: string }) => void;
  onDismiss: () => void;
}) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr]     = useState("");

  const handle = () => {
    if (!name.trim())                return setErr("Name is required");
    if (!/\S+@\S+\.\S+/.test(email)) return setErr("Valid email is required");
    setErr("");
    onSubmit({ name: name.trim(), email: email.trim() });
  };

  return (
    <div className="flex items-start gap-2 sm:gap-3 mb-4" style={{ animation: "fadeUp 0.2s ease" }}>
      {/* Bot avatar — violet S */}
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold">
        S
      </div>
      {/* Compact card — max width ~320px, no wider */}
      <div className="w-full max-w-[320px] rounded-2xl rounded-tl-sm overflow-hidden bg-[#1A1C22] border border-[#2A2C36] shadow-lg">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2A2C36] flex items-center justify-between">
          <p className="text-sm font-semibold text-[#F5F5F5]">{title}</p>
          <button onClick={onDismiss} className="text-[#636674] hover:text-[#F5F5F5] transition-colors p-0.5 shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {/* Body — label on left, input on right */}
        <div className="px-4 py-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#808290] w-10 shrink-0">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 text-sm bg-[#26272F] border border-[#363843] rounded-lg px-3 py-1.5 text-[#F5F5F5] placeholder-[#636674] focus:outline-none focus:border-[#006AE6] focus:ring-1 focus:ring-[#006AE6]/30" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#808290] w-10 shrink-0">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={(e) => e.key === "Enter" && handle()}
              className="flex-1 text-sm bg-[#26272F] border border-[#363843] rounded-lg px-3 py-1.5 text-[#F5F5F5] placeholder-[#636674] focus:outline-none focus:border-[#006AE6] focus:ring-1 focus:ring-[#006AE6]/30" />
          </div>
          {err && <p className="text-red-400 text-xs pl-[52px]">{err}</p>}
          <div className="flex justify-end pt-1">
            <button onClick={handle}
              className="px-4 py-1.5 bg-[#006AE6] hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors active:scale-[0.98]">
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isBot = msg.role === "bot";
  return (
    <div className={`flex items-end gap-2 sm:gap-3 mb-3 ${isBot ? "" : "flex-row-reverse"}`}
      style={{ animation: "fadeUp 0.2s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Avatar */}
      {isBot ? (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 text-white text-xs font-bold mb-0.5">
          S
        </div>
      ) : (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#26272F] border border-[#363843] flex items-center justify-center shrink-0 text-[#808290] mb-0.5">
          <UserIcon />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[72%] sm:max-w-[68%] px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed
        ${isBot
          ? "bg-[#1A1C22] text-[#D1D3E0] rounded-bl-sm border border-[#2A2C36]"
          : "bg-[#006AE6] text-white rounded-br-sm"
        }`}>
        {isBot ? renderMD(msg.text) : msg.text}
      </div>
    </div>
  );
}

// ── Quick Replies (in chat area — Pricing + Demo only) ────────────────────────
function ChatQuickReplies({ settings, onFAQ, onLead, visible }: {
  settings: Settings;
  onFAQ: (msg: string) => void;
  onLead: () => void;
  visible: boolean;
}) {
  const buttons = [
    { label: "💰  Give Me Pricing Details", gate: "faqs"  as keyof Settings, action: () => onFAQ("What are your pricing plans?") },
    { label: "🎯  Need Demo",               gate: "leads" as keyof Settings, action: onLead },
  ].filter((b) => settings[b.gate]);

  if (!visible || buttons.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 mb-4 ml-9 sm:ml-11 items-start">
      {buttons.map((b) => (
        <button key={b.label} onClick={b.action}
          className="text-left px-4 py-3 rounded-xl border border-gray-700 bg-gray-800/60 text-[15px] font-semibold text-gray-200 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-150 active:scale-[0.98] leading-snug">
          {b.label}
        </button>
      ))}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ settings, onChange, onNewChat, onClose, onTalkToHuman, stats }: {
  settings: Settings;
  onChange: (key: keyof Settings) => void;
  onNewChat: () => void;
  onClose: () => void;
  onTalkToHuman: () => void;
  stats: { sessions: number; csat: number };
}) {
  return (
    <div className="w-64 sm:w-64 bg-[#13151A] border-r border-[#1E2028] flex flex-col h-full">

      {/* ── Top: Branding ── */}
      <div className="px-4 py-4 flex items-center justify-between shrink-0">
        <ClarixLogo />
        <div className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#636674" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
          <button onClick={onClose} className="sm:hidden text-[#636674] hover:text-[#9A9CAE] rounded-lg p-1 transition-colors">
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* ── Chat tab — full width, clicking starts new chat ── */}
      <div className="px-3 pb-5 shrink-0">
        <div className="flex bg-[#1A1C22] rounded-xl p-1">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="flex-1 px-4 py-2 bg-[#006AE6] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#0059c9] transition-colors duration-150 active:scale-[0.97]">
            Chat
          </button>
        </div>
      </div>

      {/* ── Quick Reply ── */}
      <div className="px-4 pb-5 shrink-0">
        <p className="text-xs font-medium text-[#636674] mb-3">Quick Reply</p>
        <button
          onClick={() => { onTalkToHuman(); onClose(); }}
          className="text-left w-full px-2 py-1.5 -mx-2 text-sm text-[#9A9CAE] hover:text-[#F5F5F5] hover:bg-[#1E2028] rounded-lg transition-all duration-150">
          Talk to human
        </button>
      </div>

      {/* ── spacer ── */}
      <div className="flex-1" />

      {/* ── Chat Bot Settings ── */}
      <div className="px-3 pb-3 shrink-0">
        <p className="text-xs font-medium text-[#636674] mb-3 px-1">Chat Bot Settings</p>
        <div className="flex flex-col gap-2">

          {/* FAQ card */}
          <div className="bg-[#1A1C22] rounded-2xl px-3 py-3 flex items-center justify-between hover:bg-[#1E2028] transition-colors duration-150 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#13151A] rounded-xl flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#808290" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                  <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F5F5F5]">FAQ</p>
                <p className="text-xs text-[#636674]">Overview</p>
              </div>
            </div>
            <Toggle checked={settings.faqs} onChange={() => onChange("faqs")} />
          </div>

          {/* Lead Capture card */}
          <div className="bg-[#1A1C22] rounded-2xl px-3 py-3 flex items-center justify-between hover:bg-[#1E2028] transition-colors duration-150 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#13151A] rounded-xl flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#808290" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F5F5F5]">Lead Capture</p>
                <p className="text-xs text-[#636674]">Collect Contact Details</p>
              </div>
            </div>
            <Toggle checked={settings.leads} onChange={() => onChange("leads")} />
          </div>

        </div>
      </div>

      {/* ── Agent profile card ── */}
      <div className="mx-3 mb-3 bg-[#1A1C22] rounded-2xl p-4 hover:bg-[#1E2028] transition-colors duration-150">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white text-base font-bold shadow-lg">
              S
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#1A1C22]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-[#F5F5F5]">Clarix</p>
              <div className="w-4 h-4 rounded-full bg-[#006AE6] flex items-center justify-center shrink-0">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#636674" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <p className="text-xs text-[#636674]">AI Support Agent</p>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-[#F5F5F5]">{stats.sessions}</p>
            <p className="text-xs text-[#636674] mt-0.5">Session</p>
          </div>
          <div className="w-px h-8 bg-[#26272F]" />
          <div className="flex-1 text-center">
            <p className="text-xl font-bold text-[#F5F5F5]">{stats.csat}%</p>
            <p className="text-xs text-[#636674] mt-0.5">CSAT</p>
          </div>
        </div>
      </div>

      {/* ── Bottom: user icon + bell ── */}
      <div className="px-4 py-3 border-t border-[#1E2028] flex items-center justify-between shrink-0">
        <button
          className="w-10 h-10 rounded-full border border-[#2A2C36] flex items-center justify-center text-[#636674] hover:text-[#F5F5F5] hover:border-[#636674] transition-all duration-150 active:scale-95">
          <UserIcon />
        </button>
        <button className="w-10 h-10 rounded-full border border-[#2A2C36] flex items-center justify-center text-[#636674] hover:text-[#F5F5F5] hover:border-[#636674] transition-colors duration-150">
          <BellIcon />
        </button>
      </div>

    </div>
  );
}

// ── Message Input ─────────────────────────────────────────────────────────────
function MessageInput({ onSend, loading, disabled }: {
  onSend: (text: string) => void; loading: boolean; disabled: boolean;
}) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = val.trim();
    if (!t || loading || disabled) return;
    onSend(t);
    setVal("");
    ref.current?.focus();
  };

  return (
    <div className="px-3 sm:px-4 py-3 border-t border-gray-800 bg-gray-900 flex gap-2 sm:gap-3 items-center">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-gray-400">
        <UserIcon />
      </div>
      <textarea ref={ref} value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        placeholder="Write a message..." rows={1} disabled={disabled}
        className="flex-1 resize-none text-sm bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none disabled:opacity-40"
        style={{ maxHeight: 80 }} />
      <button onClick={send} disabled={!val.trim() || loading || disabled}
        className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0 flex items-center gap-1.5">
        <SendIcon />
        <span className="hidden sm:inline">Send</span>
      </button>
    </div>
  );
}

// ── MAIN WIDGET ───────────────────────────────────────────────────────────────
export default function App() {
  const [sessionId, setSessionId] = useState<string>(getOrCreateSessionId);
  const [settings,  setSettings]  = useState<Settings>({ faqs: true, leads: true });
  const [messages,  setMessages]  = useState<ChatMessage[]>([
    { id: 0, role: "bot", text: "Hi there! 👋 I'm Aria, your AI assistant. How can I help you today?", source: null },
  ]);
  const [loading,     setLoading]     = useState(false);
  const [chatClosed,  setChatClosed]  = useState(false);
  const [formType,    setFormType]    = useState<"lead" | "human" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats,       setStats]       = useState<{ sessions: number; csat: number }>({ sessions: 0, csat: 94 });
  const endRef = useRef<HTMLDivElement>(null);
  const idRef  = useRef(1);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, formType]);

  // Fetch live stats for sidebar profile card
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats({ sessions: d.sessions ?? 0, csat: d.csat ?? 94 }))
      .catch(() => {});
  }, []);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleSetting = (key: keyof Settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const addMsg = (role: "user" | "bot", text: string, source: string | null = null) =>
    setMessages((prev) => [...prev, { id: idRef.current++, role, text, source }]);

  // ── New Chat ────────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    const newId = makeSessionId();
    setSessionId(newId);
    idRef.current = 1;
    setMessages([{ id: 0, role: "bot", text: "Hi there! 👋 I'm Aria, your AI assistant. How can I help you today?", source: null }]);
    setLoading(false);
    setChatClosed(false);
    setFormType(null);
  };

  // ── Lead submit (Need Demo) ───────────────────────────────────────────────────
  const handleLeadSubmit = async ({ name, email }: { name: string; email: string }) => {
    setFormType(null);
    addMsg("user", "I'd like to request a demo");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name, email }),
      });
    } catch { /* non-blocking */ }
    addMsg("bot", `Thanks ${name}! Our team will email **${email}** within 24 hours to schedule your personalised demo. 🎉`, "system");
  };

  // ── Talk to Human submit ──────────────────────────────────────────────────────
  const handleHumanSubmit = async ({ name, email }: { name: string; email: string }) => {
    setFormType(null);
    addMsg("user", "I'd like to talk to a human agent");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name, email, type: "human_request" }),
      });
    } catch { /* non-blocking */ }
    addMsg("bot", `Thanks ${name}! A human agent will reach out to **${email}** within 24 hours. We'll be in touch soon! 👋`, "system");
    setChatClosed(true);
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (loading || chatClosed) return;
    setFormType(null);
    addMsg("user", text);
    setLoading(true);

    try {
      if (settings.faqs) {
        const faqAnswer = matchLocalFAQ(text);
        if (faqAnswer) {
          await new Promise((r) => setTimeout(r, 500));
          addMsg("bot", faqAnswer, "faq");
          setLoading(false);
          return;
        }
      }
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, message: text,
          context: messages.slice(-10).map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });
      const data = await res.json();
      addMsg("bot", data.reply, data.source || "llm");
    } catch {
      addMsg("bot", "I'm having trouble connecting right now. Please try again in a moment.", "fallback");
    } finally {
      setLoading(false);
    }
  };

  const showQuickReplies = messages.length === 1 && !loading && !chatClosed && !formType;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-950 text-white relative">

      {/* ── Mobile sidebar overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/60 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar — always visible on sm+, drawer on mobile ── */}
      <div className={`
        fixed sm:relative inset-y-0 left-0 z-30
        transform transition-transform duration-300 ease-in-out
        sm:transform-none sm:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        sm:flex shrink-0
      `}>
        <Sidebar
          settings={settings}
          onChange={toggleSetting}
          onNewChat={handleNewChat}
          onClose={() => setSidebarOpen(false)}
          onTalkToHuman={() => { setFormType("human"); setSidebarOpen(false); }}
          stats={stats}
        />
      </div>

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">

        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="sm:hidden text-gray-400 hover:text-gray-200 transition-colors p-1 -ml-1">
              <MenuIcon />
            </button>
            <div>
              <p className="font-semibold text-white text-sm sm:text-base">Clarix</p>
              <p className="text-xs text-gray-500">Online · Typically Replies Instantly</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:inline">Bot Active</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 pt-4 sm:pt-5 pb-2">
          {messages.map((m) => <Bubble key={m.id} msg={m} />)}

          {/* Quick replies in chat (Pricing + Demo only) */}
          <ChatQuickReplies
            settings={settings}
            visible={showQuickReplies}
            onFAQ={handleSend}
            onLead={() => setFormType("lead")}
          />

          {/* Inline lead/demo form */}
          {formType === "lead" && (
            <InlineFormCard
              title="Request a Demo"
              submitLabel="Book Demo"
              onSubmit={handleLeadSubmit}
              onDismiss={() => setFormType(null)}
            />
          )}

          {/* Inline talk-to-human form */}
          {formType === "human" && (
            <InlineFormCard
              title="Talk to a Human"
              submitLabel="Connect Me"
              onSubmit={handleHumanSubmit}
              onDismiss={() => setFormType(null)}
            />
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-end gap-2 sm:gap-3 mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                S
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Message Input */}
        <MessageInput onSend={handleSend} loading={loading} disabled={chatClosed} />

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-700 py-2 border-t border-gray-800/50">
          Powered By Clarix AI &nbsp;•&nbsp; End to End Encrypted
        </div>
      </div>
    </div>
  );
}
