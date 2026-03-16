import { useState } from "react";
import AdminDashboard from "../components/admin/Dashboard";
import api from "../api/client";

// ── Clarix icon (item.svg circle part — 34×34) ────────────────────────────────
const ClarixIcon34 = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" fill="#1B1C22"/>
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" stroke="#363843"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0001 21.9618C19.7374 21.9618 21.9575 19.7419 21.9575 17.0044C21.9575 14.2669 19.7374 12.0469 17.0001 12.0469C14.2626 12.0469 12.0426 14.2669 12.0426 17.0044C12.0426 17.6652 12.172 18.2957 12.4067 18.8722C12.5146 19.1374 12.6449 19.3911 12.7951 19.631L12.4227 20.3436L11.709 21.7102L11.7091 21.7109L13.3612 21.3469L14.2744 21.1457C15.0565 21.6614 15.9934 21.9618 17.0001 21.9618Z" fill="#1B1C22"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0007 21.963C15.994 21.963 15.0573 21.6626 14.2752 21.1468L13.3619 21.3481L11.7251 21.7086C12.3149 22.369 13.0267 22.9181 13.8252 23.3202C14.7801 23.8011 15.8589 24.072 17.0008 24.072C19.0316 24.072 20.8626 24.9285 22.1524 26.2998C21.9988 25.0502 21.3795 23.9445 20.4735 23.1616C22.6215 21.9479 24.072 19.6434 24.072 17.0008C24.072 13.0962 20.9054 9.92969 17.0008 9.92969C13.0962 9.92969 9.92969 13.0962 9.92969 17.0008C9.92969 18.8039 10.6049 20.4496 11.7163 21.6988L12.4235 20.3447L12.7958 19.6321C12.6457 19.3922 12.5154 19.1385 12.4074 18.8733C12.1727 18.2969 12.0433 17.6663 12.0433 17.0055C12.0433 14.391 14.0685 12.2484 16.6353 12.0613C16.756 12.0525 16.8779 12.048 17.0008 12.048C17.128 12.048 17.2541 12.0528 17.3789 12.0622C19.9398 12.2554 21.9583 14.3953 21.9583 17.0055C21.9583 19.6638 19.8648 21.8341 17.2371 21.9574C17.1586 21.9611 17.08 21.963 17.0008 21.963Z" fill="url(#ciGrad0)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M20.4735 23.1615C19.6054 22.4113 18.4741 21.9575 17.2371 21.9574C19.8648 21.8341 21.9583 19.6638 21.9583 17.0055C21.9583 14.3953 19.9397 12.2554 17.3789 12.0622C17.2541 12.0528 17.128 12.048 17.0008 12.048C16.8778 12.048 16.756 12.0525 16.6352 12.0613C14.0684 12.2484 12.0433 14.391 12.0433 17.0055C12.0433 17.6663 12.1727 18.2969 12.4074 18.8733C12.5153 19.1385 12.6456 19.3922 12.7958 19.6321L12.4234 20.3447L11.7163 21.6988C10.6049 20.4496 9.92969 18.8039 9.92969 17.0008C9.92969 13.0962 13.0962 9.92969 17.0008 9.92969C20.9054 9.92969 24.072 13.0962 24.072 17.0008C24.072 19.6434 22.6215 21.9479 20.4735 23.1615Z" fill="url(#ciGrad1)"/>
    <defs>
      <linearGradient id="ciGrad0" x1="20.8251" y1="11.0239" x2="13.3091" y2="26.4338" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
      <linearGradient id="ciGrad1" x1="24.0236" y1="3.21779" x2="-15.875" y2="81.5231" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function AdminPage() {
  const [authed,   setAuthed]   = useState(!!localStorage.getItem("admin_token"));
  const [email,    setEmail]    = useState("admin@demo.com");
  const [password, setPassword] = useState("admin123");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/admin/login", { email, password });
      localStorage.setItem("admin_token", data.token);
      setAuthed(true);
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("admin_token");
    setAuthed(false);
  };

  if (authed) {
    return <AdminDashboard onSignOut={signOut} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <ClarixIcon34 />
          <div>
            <p className="font-bold text-white">Clarix Admin</p>
            <p className="text-xs text-gray-500">Support Dashboard</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Password"
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <button
            onClick={login}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <p className="text-center text-xs text-gray-600 mt-1">
            Default: admin@demo.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
