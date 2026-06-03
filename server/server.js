/**
 * ══════════════════════════════════════════════════════════════════════════════
 * Main Server Entry Point
 * ══════════════════════════════════════════════════════════════════════════════
 */

const express        = require("express");
const cors           = require("cors");
const helmet         = require("helmet");
const mongoSanitize  = require("express-mongo-sanitize");
const hpp            = require("hpp");
const cookieParser   = require("cookie-parser");
const session        = require("express-session");
const mongoose       = require("mongoose");
const passport       = require("./config/passport");
const path           = require("path");
const pinoHttp       = require("pino-http");

// ── Load environment configuration first ────────────────────────────────────
const env = require("./config/env");
const corsConfig = require("./config/cors");
const { sessionCookieOptions } = require("./config/cookies");
const { checkEmailService } = require("./services/emailService");
const logger = require("./config/logger");
const { securityLogger, notFoundLogger } = require("./middleware/securityLogger");
const { csrfMiddleware, csrfTokenHandler } = require("./middleware/csrf");

// ── Import routes ──────────────────────────────────────────────────────────
const authRoutes          = require("./routes/auth");
const googleAuthRoutes    = require("./routes/googleAuth");
const progressRoutes      = require("./routes/progress");
const shopRoutes          = require("./routes/shop");
const parentRoutes        = require("./routes/parent");
const teacherRoutes       = require("./routes/teacher");
const teacherContentRoutes = require("./routes/teacherContent");
const studentContentRoutes = require("./routes/studentContent");
const adminRoutes         = require("./routes/admin");
const adminVideoRoutes    = require("./routes/adminVideos");
const videoRoutes         = require("./routes/videos");
const uploadRoutes        = require("./routes/upload");
const analyticsChildRoutes = require("./routes/analyticsChild");
const analyticsClassRoutes = require("./routes/analyticsClass");
const roadmapRoutes       = require("./routes/roadmap");
const autoSeedRoadmap     = require("./utils/autoSeedRoadmap");
const testLogRoutes       = require("./routes/testLog");
const drawGameRoutes      = require("./routes/drawGame");
const chatGameRoutes      = require("./routes/chatGame");
const transcribeRoutes    = require("./routes/transcribe");

// ── Initialize Express app ────────────────────────────────────────────────
const app = express();

// ── Build Redis session store (async) ────────────────────────────────────────
async function buildSessionStore() {
  if (!env.REDIS_URL) {
    if (env.isProduction) {
      logger.warn(
        "REDIS_URL not set — using MemoryStore for sessions in production. " +
        "Set REDIS_URL for a persistent, scalable session store."
      );
    }
    return undefined; // Express-session default MemoryStore
  }

  try {
    const { createClient } = require("redis");
    const { RedisStore } = require("connect-redis");

    const redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on("error", (err) =>
      logger.error({ err: err.message }, "Redis client error")
    );
    await redisClient.connect();
    logger.info("Redis session store connected");
    return new RedisStore({ client: redisClient, prefix: "sess:" });
  } catch (err) {
    logger.warn({ err: err.message }, "Redis unavailable, falling back to MemoryStore");
    return undefined;
  }
}

// ── Server startup (all middleware + routes registered here to guarantee order) ─
async function startServer() {
  try {
    await checkEmailService();

    logger.info("Connecting to MongoDB...");
    await mongoose.connect(env.MONGODB_URI);
    logger.info("MongoDB connected successfully");

    // Build session store before registering middleware
    const sessionStore = await buildSessionStore();

    // ── Trust proxy ─────────────────────────────────────────────────────────
    if (env.TRUST_PROXY) {
      app.set("trust proxy", 1);
      logger.info("Proxy trust enabled for Render");
    }

    // ── HTTP request logging ─────────────────────────────────────────────────
    app.use(
      pinoHttp({
        logger,
        serializers: { req: () => undefined, res: () => undefined },
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

    // ── Security headers (helmet + Content Security Policy) ─────────────────
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'"],
            styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc:     ["'self'", "https://fonts.gstatic.com"],
            imgSrc:      ["'self'", "data:", "blob:", "https:"],
            connectSrc:  ["'self'", env.CLIENT_URL].filter(Boolean),
            frameSrc:    ["'none'"],
            objectSrc:   ["'none'"],
            ...(env.isProduction && { upgradeInsecureRequests: [] }),
          },
        },
        crossOriginEmbedderPolicy: false,
      })
    );

    // ── Health check (trước CORS để wget/curl không bị block) ───────────────
    app.get("/api/health", (_req, res) => {
      res.json({ ok: true, environment: env.NODE_ENV, timestamp: new Date().toISOString() });
    });

    // ── CORS ─────────────────────────────────────────────────────────────────
    app.use(cors(corsConfig));

    // ── Body parsing ─────────────────────────────────────────────────────────
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ limit: "10mb", extended: true }));
    app.use(cookieParser());

    // ── JSON parse error handler ─────────────────────────────────────────────
    app.use((err, req, res, next) => {
      if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({ error: "Invalid JSON in request body." });
      }
      next(err);
    });

    // ── NoSQL injection prevention ───────────────────────────────────────────
    // req.query là getter-only trên Express prototype → không dùng middleware trực tiếp
    app.use((req, res, next) => {
      if (req.body)   req.body   = mongoSanitize.sanitize(req.body,   { replaceWith: "_" });
      if (req.params) req.params = mongoSanitize.sanitize(req.params, { replaceWith: "_" });
      next();
    });

    // ── HTTP Parameter Pollution prevention ──────────────────────────────────
    app.use(hpp());

    // ── Threat detection & security logging ──────────────────────────────────
    app.use(securityLogger);

    // ── Express session (for OAuth handshake) ────────────────────────────────
    app.use(
      session({
        secret: env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: sessionCookieOptions,
      })
    );

    // ── Passport (OAuth) ─────────────────────────────────────────────────────
    app.use(passport.initialize());
    app.use(passport.session());

    // ── CSRF protection (authenticated POST/PUT/PATCH/DELETE) ────────────────
    app.use(csrfMiddleware);

    // ── Static uploads ───────────────────────────────────────────────────────
    app.use("/uploads", express.static(path.join(__dirname, "uploads")));

    // ── CSRF token endpoint ──────────────────────────────────────────────────
    app.get("/api/csrf-token", csrfTokenHandler);

    // ── API Routes ───────────────────────────────────────────────────────────
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
    app.use("/api/draw-game", drawGameRoutes);
    app.use("/api/chat-game", chatGameRoutes);
    app.use("/api/transcribe", transcribeRoutes);

    // ── 404 handler (logs probing attempts) ──────────────────────────────────
    app.use(notFoundLogger);

    // ── Global error handler ──────────────────────────────────────────────────
    app.use((err, req, res, next) => {
      logger.error({ err: err.message, status: err.status }, "API error");
      res.status(err.status || 500).json({
        error: env.isProduction ? "Internal server error" : err.message,
      });
    });

    await autoSeedRoadmap();

    app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, environment: env.NODE_ENV, clientUrl: env.CLIENT_URL },
        "Server started"
      );
    });
  } catch (error) {
    logger.error({ err: error.message }, "Startup failed");
    process.exit(1);
  }
}

startServer();

// ── Graceful shutdown ───────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
