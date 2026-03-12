import { useState } from "react";
import AdminDashboard from "../components/admin/Dashboard";
import api from "../api/client";

export default function AdminPage() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("admin_token"));
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  if (authed) {
    return (
      <div>
        <AdminDashboard />
        <button
          onClick={() => { localStorage.removeItem("admin_token"); setAuthed(false); }}
          className="fixed top-4 right-4 z-50 text-xs text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            Q
          </div>
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
