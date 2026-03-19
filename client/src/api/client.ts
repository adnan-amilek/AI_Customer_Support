import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Parse JWT expiry without a library ──────────────────────────────────────
function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// ── Attach JWT + auto-refresh when < 24 hrs remain ──────────────────────────
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("admin_token");
  if (!token) return config;

  const exp = getTokenExp(token);
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Refresh if expiry is within 24 hrs (but not already the refresh call itself)
  if (exp && exp - Date.now() < ONE_DAY && !config.url?.includes("/admin/refresh")) {
    try {
      const { data } = await axios.post(
        `${config.baseURL ?? "/api"}/admin/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("admin_token", data.token);
      config.headers.Authorization = `Bearer ${data.token}`;
      return config;
    } catch {
      // Refresh failed — carry on with the existing token; 401 will log them out
    }
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
