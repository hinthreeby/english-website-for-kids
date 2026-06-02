const crypto = require("crypto");
const env = require("../config/env");
const { security } = require("../config/loggers");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Paths exempt from CSRF: OAuth browser redirects + unauthenticated auth endpoints
const CSRF_EXEMPT = [
  /^\/auth\/google/,
  /^\/api\/auth\/(login|register-init|register-verify|register|login-verify|forgot-password|verify-reset-otp|reset-password|resend-otp|logout)$/,
  /^\/auth\/(verify-code|resend-code)$/,
  /^\/api\/csrf-token$/,
  /^\/api\/health$/,
];

// Stateless signed token bound to the user's JWT cookie (session binding).
// Format: random_hex.HMAC(random_hex:hourkey:session_binding, JWT_SECRET)
// Valid for ~2 hours (current + previous hour window).

function hourKey() {
  return Math.floor(Date.now() / (60 * 60 * 1000)).toString();
}

function hmac(data, key) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

// Derives a short binding string from the user's JWT cookie so the CSRF token
// is tied to their specific session and cannot be reused cross-session.
function sessionBinding(jwtCookie) {
  if (!jwtCookie) return "";
  return crypto.createHash("sha256").update(jwtCookie).digest("hex").slice(0, 16);
}

function createCsrfToken(jwtCookie = "") {
  const random = crypto.randomBytes(32).toString("hex");
  const sig = hmac(`${random}:${hourKey()}:${sessionBinding(jwtCookie)}`, env.JWT_SECRET);
  return `${random}.${sig}`;
}

function verifyCsrfToken(value, jwtCookie = "") {
  if (!value || typeof value !== "string") return false;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return false;
  const random = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^[0-9a-f]{64}$/i.test(sig)) return false;

  const binding = sessionBinding(jwtCookie);
  const currentHour = parseInt(hourKey(), 10);
  for (const h of [currentHour, currentHour - 1]) {
    const expected = hmac(`${random}:${h}:${binding}`, env.JWT_SECRET);
    try {
      if (crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
        return true;
      }
    } catch { /* length mismatch → invalid */ }
  }
  return false;
}

const csrfMiddleware = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const url = req.path || req.url || "";
  if (CSRF_EXEMPT.some((rx) => rx.test(url))) return next();

  // Only enforce for authenticated requests (JWT cookie present)
  if (!req.cookies?.token) return next();

  const jwtCookie = req.cookies.token;
  const headerToken = req.headers?.["x-csrf-token"];
  if (!headerToken || !verifyCsrfToken(headerToken, jwtCookie)) {
    security("csrf_failed", {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      message: "CSRF token missing or invalid",
    });
    return res.status(403).json({ error: "Invalid or missing CSRF token." });
  }

  next();
};

// GET /api/csrf-token – returns a fresh token bound to the caller's JWT cookie
const csrfTokenHandler = (req, res) =>
  res.json({ csrfToken: createCsrfToken(req.cookies?.token || "") });

module.exports = { csrfMiddleware, csrfTokenHandler, createCsrfToken, verifyCsrfToken };
