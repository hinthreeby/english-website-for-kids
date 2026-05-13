const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const authRoutes = require("./routes/auth");
const googleAuthRoutes = require("./routes/googleAuth");
const progressRoutes = require("./routes/progress");
const shopRoutes = require("./routes/shop");
const parentRoutes = require("./routes/parent");
const teacherRoutes = require("./routes/teacher");
const adminRoutes = require("./routes/admin");
const analyticsChildRoutes = require("./routes/analyticsChild");
const analyticsClassRoutes = require("./routes/analyticsClass");
const passport = require("./config/passport");

const app = express();

// Configure CORS for multiple origins (dev + production)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://english-website-for-kids.vercel.app",
];

// Add CLIENT_URL from env if set (for flexibility)
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Error handler for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }
  next();
});

// Session is used only for the OAuth handshake; app auth uses JWT cookies
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", sameSite: "lax" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/children", analyticsChildRoutes);
app.use("/api/classes", analyticsClassRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/funEnglish";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
