/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CORS Configuration
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Centralized CORS setup for localhost (development) and production deployments.
 * Handles cross-origin credentials (cookies, JWT) and preflight requests.
 *
 * Key points:
 * - Development: allows http://localhost:5173, :3000
 * - Production: allows only https://english-website-for-kids.vercel.app
 * - credentials: true enables cookies/auth headers across origins
 * - sameSite: 'none' + secure: true = cross-site cookies work
 */

const env = require("./env");

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins() {
  const baseOrigins = [
    "http://localhost:5173",  // Vite dev server
    "http://localhost:3000",  // Alternative dev server
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

  // Add CLIENT_URL from environment
  if (env.CLIENT_URL && !baseOrigins.includes(env.CLIENT_URL)) {
    baseOrigins.push(env.CLIENT_URL);
  }

  // In production, only allow production frontend
  if (env.isProduction) {
    return [env.CLIENT_URL];
  }

  return baseOrigins;
}

const allowedOrigins = getAllowedOrigins();

/**
 * CORS middleware configuration
 */
const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] ❌ Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },

  credentials: true, // Allow cookies and auth headers

  // Allowed methods for requests
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

  // Allowed request headers
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cookie",
    "X-Requested-With",
  ],

  // Headers that client can access in response
  exposedHeaders: ["Content-Length", "X-JSON-Response-Size"],

  // Cache preflight requests for 24 hours
  maxAge: 86400,

  // Always set Vary: Origin header
  preflightContinue: false,
};

console.log("[CORS] ✅ Configuration:");
console.log(`     Allowed origins: ${allowedOrigins.join(", ")}`);
console.log(`     Credentials: ${corsConfig.credentials}`);

module.exports = corsConfig;
