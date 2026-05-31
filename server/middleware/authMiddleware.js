const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");
const { auth, security } = require("../config/loggers");

const protect = async (req, res, next) => {
  const ip        = req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers?.["user-agent"];
  const url       = req.originalUrl || req.url;

  const bearer = req.headers.authorization?.replace("Bearer ", "");
  const token  = req.cookies?.token || bearer;

  if (!token) {
    security("unauthorized_access", {
      reason: "no_token",
      method: req.method,
      url,
      ip,
      userAgent,
      message: "Request to protected route without token",
    });
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Separate JWT verification so we can distinguish expired vs invalid
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (jwtErr) {
    const event = jwtErr.name === "TokenExpiredError" ? "token_expired" : "token_invalid";
    auth("warn", event, {
      reason:    jwtErr.message,
      url,
      ip,
      userAgent,
      message:   `${event}: ${jwtErr.message}`,
    });
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    const userId = decoded.id || decoded.userId;
    const user   = await User.findById(userId).select("-password");

    if (!user || !user.isActive) {
      auth("warn", "token_invalid", {
        reason: !user ? "user_not_found" : "account_disabled",
        userId: userId?.toString(),
        url,
        ip,
        message: "Valid token but user not found or disabled",
      });
      return res.status(401).json({ error: "Account not found or disabled" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    // Log when a non-admin user probes an admin-only route
    if (req.user && roles.includes("admin")) {
      security("unauthorized_admin_access", {
        userId:    req.user._id.toString(),
        role:      req.user.role,
        reason:    `Role "${req.user.role}" attempted admin-only access`,
        method:    req.method,
        url:       req.originalUrl || req.url,
        ip:        req.ip || req.socket?.remoteAddress,
        userAgent: req.headers?.["user-agent"],
        message:   "Unauthorized admin access attempt",
      });
    }
    return res.status(403).json({
      error:   "FORBIDDEN",
      message: `Requires role: ${roles.join(" or ")}`,
    });
  }
  return next();
};

const isAdmin   = requireRole("admin");
const isTeacher = requireRole("teacher", "admin");
const isParent  = requireRole("parent",  "admin");
const isChild   = requireRole("child",   "admin");

module.exports = { protect, requireRole, isAdmin, isTeacher, isParent, isChild };
