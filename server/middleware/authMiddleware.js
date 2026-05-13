const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");

const protect = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.replace("Bearer ", "");
    const token = req.cookies?.token || bearer;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    const user = await User.findById(userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Account not found or disabled" });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      error: "FORBIDDEN",
      message: `Requires role: ${roles.join(" or ")}`,
    });
  }
  return next();
};

const isAdmin = requireRole("admin");
const isTeacher = requireRole("teacher", "admin");
const isParent = requireRole("parent", "admin");
const isChild = requireRole("child", "admin");

module.exports = { protect, requireRole, isAdmin, isTeacher, isParent, isChild };
