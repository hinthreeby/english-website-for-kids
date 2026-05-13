/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Cookie Configuration Module
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Centralized cookie settings for JWT authentication across:
 * - localhost (development): insecure, lax SameSite
 * - Vercel + Render (production): secure, none SameSite for cross-origin
 *
 * Why different settings per environment:
 *
 * Development (localhost):
 *   - secure: false (HTTP not HTTPS)
 *   - sameSite: 'lax' (safer default)
 *   - httpOnly: true (prevent XSS access)
 *
 * Production (Vercel frontend + Render backend):
 *   - secure: true (HTTPS only)
 *   - sameSite: 'none' (required for cross-site cookies with credentials)
 *   - httpOnly: true (prevent XSS access)
 *
 * Cross-origin cookies workflow:
 * 1. Frontend (vercel.app) makes request to backend (render.com)
 * 2. Backend sets token cookie with: secure=true, sameSite=none, httpOnly=true
 * 3. Browser allows cookie if:
 *    - Connection is HTTPS
 *    - sameSite is 'none'
 *    - request has credentials: true
 * 4. Frontend automatically sends cookie on subsequent requests
 */

const env = require("./env");

/**
 * Build cookie options based on environment
 */
function buildCookieOptions() {
  const options = {
    httpOnly: true,           // Prevent JS access (XSS protection)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };

  // Production settings (Vercel + Render with HTTPS)
  if (env.isProduction) {
    options.secure = true;    // HTTPS only
    options.sameSite = "none"; // Required for cross-origin cookies
  } else {
    // Development settings (localhost HTTP)
    options.secure = false;   // Allow HTTP
    options.sameSite = "lax";  // Safer default for same-site requests
  }

  // Allow override via environment variables if needed
  if (env.COOKIE_SECURE !== undefined) {
    options.secure = env.COOKIE_SECURE;
  }
  if (env.COOKIE_SAMESITE) {
    options.sameSite = env.COOKIE_SAMESITE;
  }

  return options;
}

const cookieOptions = buildCookieOptions();

/**
 * Session cookie options (separate for express-session)
 */
const sessionCookieOptions = {
  ...cookieOptions,
  secure: env.isProduction, // Must match cookie config
  sameSite: env.isProduction ? "none" : "lax",
};

console.log("[COOKIES] ✅ Configuration:");
console.log(`     httpOnly: ${cookieOptions.httpOnly}`);
console.log(`     secure: ${cookieOptions.secure}`);
console.log(`     sameSite: ${cookieOptions.sameSite}`);
console.log(`     maxAge: ${cookieOptions.maxAge} ms`);

module.exports = {
  cookieOptions,
  sessionCookieOptions,
  buildCookieOptions,
};
