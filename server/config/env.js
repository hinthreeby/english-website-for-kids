/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Environment Configuration Module
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Centralized environment variable management with validation and defaults.
 * Loaded at server startup before any other modules.
 *
 * Usage:
 *   const env = require('./config/env');
 *   console.log(env.NODE_ENV);
 *   console.log(env.MONGODB_URI);
 */

const path = require("path");
const dotenv = require("dotenv");

// ── Load environment variables ─────────────────────────────────────────────────
// Priority: .env.production/.env.development > .env > defaults
const NODE_ENV = process.env.NODE_ENV || "development";
const envFile = NODE_ENV === "production" ? ".env.production" : ".env.development";
const envPath = path.join(__dirname, "..", envFile);

console.log(`[ENV] Loading configuration from: ${envFile}`);
dotenv.config({ path: envPath });

// ── Validate and export configuration ──────────────────────────────────────────

const env = {
  // Core
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  TRUST_PROXY: process.env.TRUST_PROXY === "true",

  // Database
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/funEnglish",

  // JWT & Session
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Frontend
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Email (Resend)
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || "onboarding@resend.dev",

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

  // Cookies
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true" || NODE_ENV === "production",
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || (NODE_ENV === "production" ? "none" : "lax"),

  // Derived flags
  isDevelopment: NODE_ENV === "development",
  isProduction: NODE_ENV === "production",
};

// ── Validate required secrets ──────────────────────────────────────────────────
const requiredSecrets = ["JWT_SECRET", "SESSION_SECRET"];
const missingSecrets = requiredSecrets.filter((key) => !env[key]);

if (missingSecrets.length > 0) {
  console.error(
    `[ENV] ❌ Missing required environment variables: ${missingSecrets.join(", ")}`
  );
  console.error(`[ENV] Please check your ${envFile} file.`);
  process.exit(1);
}

// ── Validate Resend configuration ──────────────────────────────────────────────
if (!env.RESEND_API_KEY) {
  console.error("[ENV] ❌ Missing RESEND_API_KEY - email sending will fail");
}

// ── Log environment on startup ────────────────────────────────────────────────
console.log("[ENV] ✅ Configuration loaded:");
console.log(`     NODE_ENV: ${env.NODE_ENV}`);
console.log(`     PORT: ${env.PORT}`);
console.log(`     CLIENT_URL: ${env.CLIENT_URL}`);
console.log(`     MONGODB_URI: ${env.MONGODB_URI.substring(0, 50)}...`);
console.log(`     COOKIE_SECURE: ${env.COOKIE_SECURE}`);
console.log(`     COOKIE_SAMESITE: ${env.COOKIE_SAMESITE}`);
console.log(`     TRUST_PROXY: ${env.TRUST_PROXY}`);
console.log(
  `     EMAIL_FROM: ${env.EMAIL_FROM} (Resend)`
);

module.exports = env;
