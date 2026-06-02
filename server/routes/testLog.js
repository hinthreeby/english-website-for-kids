const express = require("express");
const router = express.Router();
const logger = require("../config/logger");
const env = require("../config/env");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// In production this endpoint is locked down to admins only.
// In development it remains open for ELK pipeline testing.
const guardMiddleware = env.isProduction ? [protect, isAdmin] : [];

router.get("/", ...guardMiddleware, (req, res) => {
  logger.info("Test log created for ELK pipeline");
  res.json({ message: "Log created successfully" });
});

module.exports = router;
