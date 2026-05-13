/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Main Server Entry Point
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Production-ready Express server with:
 * - Centralized environment configuration
 * - MongoDB connection management
 * - CORS & cookie setup
 * - Middleware pipeline
 * - Error handling
 * - Health check endpoint
 *
 * Usage:
 *   npm run dev (development)
 *   npm start (production on Render)
 */

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("./config/passport");

// ── Load environment configuration first ────────────────────────────────────
const env = require("./config/env");
const corsConfig = require("./config/cors");
const { sessionCookieOptions } = require("./config/cookies");
const { checkEmailService } = require("./services/emailService");

// ── Import routes ──────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const googleAuthRoutes = require("./routes/googleAuth");
const progressRoutes = require("./routes/progress");
const shopRoutes = require("./routes/shop");
const parentRoutes = require("./routes/parent");
const teacherRoutes = require("./routes/teacher");
const adminRoutes = require("./routes/admin");
const analyticsChildRoutes = require("./routes/analyticsChild");
const analyticsClassRoutes = require("./routes/analyticsClass");

// ── Initialize Express app ────────────────────────────────────────────────
const app = express();

// ── Trust proxy for Render (behind reverse proxy with X-Forwarded-* headers) ─
if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
  console.log("[SERVER] ✅ Proxy trust enabled for Render");
}

// ── Middleware: CORS ────────────────────────────────────────────────────────
app.use(cors(corsConfig));

// ── Middleware: Body parsing ────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// ── Middleware: JSON parsing error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }
  next();
});

// ── Middleware: Express session (for OAuth handshake) ──────────────────────
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: sessionCookieOptions,
  })
);

// ── Middleware: Passport (OAuth) ────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Health Check Endpoint ───────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/children", analyticsChildRoutes);
app.use("/api/classes", analyticsClassRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(err.status || 500).json({
    error: env.isProduction ? "Internal server error" : err.message,
  });
});

// ── Database Connection & Server Startup ────────────────────────────────────
async function startServer() {
  try {
    // Check email service
    await checkEmailService();

    // Connect to MongoDB
    console.log("[DB] Connecting to MongoDB...");
    await mongoose.connect(env.MONGODB_URI);
    console.log("[DB] ✅ MongoDB connected");

    // Start listening
    app.listen(env.PORT, () => {
      console.log(`[SERVER] ✅ Server running on port ${env.PORT}`);
      console.log(`[SERVER]    Environment: ${env.NODE_ENV}`);
      console.log(`[SERVER]    Frontend URL: ${env.CLIENT_URL}`);
      console.log(`[SERVER]    MongoDB: ${env.MONGODB_URI.substring(0, 40)}...`);
    });
  } catch (error) {
    console.error("[SERVER] ❌ Startup error:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// ── Graceful shutdown ───────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  console.log("[SERVER] ⚠️  SIGTERM received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
