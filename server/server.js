const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const progressRoutes = require("./routes/progress");
const shopRoutes = require("./routes/shop");
const parentRoutes = require("./routes/parent");
const teacherRoutes = require("./routes/teacher");
const adminRoutes = require("./routes/admin");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);

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
