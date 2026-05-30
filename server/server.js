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
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const path = require("path");
const pinoHttp = require("pino-http");

// ── Load environment configuration first ────────────────────────────────────
const env = require("./config/env");
const corsConfig = require("./config/cors");
const { sessionCookieOptions } = require("./config/cookies");
const { checkEmailService } = require("./services/emailService");
const logger = require("./config/logger");

// ── Import routes ──────────────────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const googleAuthRoutes = require("./routes/googleAuth");
const progressRoutes = require("./routes/progress");
const shopRoutes = require("./routes/shop");
const parentRoutes = require("./routes/parent");
const teacherRoutes = require("./routes/teacher");
const teacherContentRoutes = require("./routes/teacherContent");
const studentContentRoutes = require("./routes/studentContent");
const adminRoutes = require("./routes/admin");
const adminVideoRoutes = require("./routes/adminVideos");
const videoRoutes = require("./routes/videos");
const uploadRoutes = require("./routes/upload");
const analyticsChildRoutes = require("./routes/analyticsChild");
const analyticsClassRoutes = require("./routes/analyticsClass");
const roadmapRoutes    = require("./routes/roadmap");
const autoSeedRoadmap  = require("./utils/autoSeedRoadmap");
const testLogRoutes    = require("./routes/testLog");

// ── Initialize Express app ────────────────────────────────────────────────
const app = express();

// ── Trust proxy for Render (behind reverse proxy with X-Forwarded-* headers) ─
if (env.TRUST_PROXY) {
  app.set("trust proxy", 1);
  logger.info("Proxy trust enabled for Render");
}

// ── Middleware: HTTP request logging (pino-http) ─────────────────────────────
// Flat top-level fields so Filebeat/ELK can parse without extra mapping config.
app.use(
  pinoHttp({
    logger,
    // Suppress nested req/res objects; fields are injected flat via customProps
    serializers: {
      req: () => undefined,
      res: () => undefined,
    },
    // Called when response finishes — res.statusCode is final at this point
    customProps(req, res) {
      return {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers?.["user-agent"],
      };
    },
  })
);

// ── Middleware: Security headers ────────────────────────────────────────────
app.use(helmet());

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

// ── Serve uploaded files as static assets ──────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.use("/api/teacher/contents", teacherContentRoutes);
app.use("/api/student/contents", studentContentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/videos", adminVideoRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/children", analyticsChildRoutes);
app.use("/api/classes", analyticsClassRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/v1/test-log", testLogRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ err: err.message, status: err.status }, "API error");
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
    logger.info("Connecting to MongoDB...");
    await mongoose.connect(env.MONGODB_URI);
    logger.info("MongoDB connected successfully");

    // Ensure default roadmap data exists
    await autoSeedRoadmap();

    // Start listening
    app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
          clientUrl: env.CLIENT_URL,
        },
        "Server started"
      );
    });
  } catch (error) {
    logger.error({ err: error.message }, "Startup failed");
    process.exit(1);
  }
}

// Start the server
startServer();

// ── Graceful shutdown ───────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
