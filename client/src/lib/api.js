import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://english-website-for-kids.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ── CSRF token management ──────────────────────────────────────────────────
// The backend issues a stateless signed CSRF token via GET /api/csrf-token.
// We store it in memory (never in localStorage/sessionStorage) and attach it
// as X-CSRF-Token on every state-changing request.

let csrfToken = null;
let csrfPending = null;

async function refreshCsrfToken() {
  if (!csrfPending) {
    csrfPending = axios
      .get(`${API_BASE_URL}/api/csrf-token`, { withCredentials: true })
      .then((res) => {
        csrfToken = res.data?.csrfToken ?? null;
        return csrfToken;
      })
      .catch(() => {
        csrfToken = null;
        return null;
      })
      .finally(() => {
        csrfPending = null;
      });
  }
  return csrfPending;
}

const MUTATING = new Set(["post", "put", "patch", "delete"]);

// Request interceptor: attach CSRF token to state-changing requests
api.interceptors.request.use(async (config) => {
  if (MUTATING.has(config.method?.toLowerCase())) {
    if (!csrfToken) await refreshCsrfToken();
    if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

// Response interceptor: on CSRF failure (403) refresh token and retry once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const is403Csrf =
      error.response?.status === 403 &&
      typeof error.response?.data?.error === "string" &&
      error.response.data.error.toLowerCase().includes("csrf");

    if (is403Csrf && !error.config._csrfRetried) {
      error.config._csrfRetried = true;
      csrfToken = null;
      await refreshCsrfToken();
      if (csrfToken) {
        error.config.headers["X-CSRF-Token"] = csrfToken;
        return api(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
