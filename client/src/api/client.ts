import axios from "axios";

// In dev, Vite proxies /api → http://localhost:3001 (see vite.config.ts)
// In prod, set VITE_API_URL to your deployed backend URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT for admin requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
