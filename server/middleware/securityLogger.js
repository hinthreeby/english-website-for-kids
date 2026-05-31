const { security } = require("../config/loggers");

const PATH_TRAVERSAL    = /\.\.\/|%2e%2e/i;
const XSS_PATTERN       = /<script|javascript:|onerror=/i;
const NOSQL_PATTERN     = /\$ne|\$gt|\$where|\$regex/;
const SQL_PATTERN       = /'\s*OR\s+1\s*=\s*1|UNION\s+SELECT|DROP\s+TABLE/i;
const SUSPICIOUS_AGENTS = /sqlmap|nikto|nmap|masscan|dirbuster|gobuster/i;

function detectThreat(req) {
  const url      = req.originalUrl || req.url;
  const ua       = req.headers?.["user-agent"] || "";
  const body     = JSON.stringify(req.body  || {});
  const query    = JSON.stringify(req.query || {});
  const combined = url + body + query;

  if (SUSPICIOUS_AGENTS.test(ua))   return "suspicious_user_agent";
  if (PATH_TRAVERSAL.test(url))     return "path_traversal";
  if (XSS_PATTERN.test(combined))   return "xss_attempt";
  if (NOSQL_PATTERN.test(combined)) return "nosql_injection";
  if (SQL_PATTERN.test(combined))   return "sql_injection";
  return null;
}

const securityLogger = (req, res, next) => {
  const threat = detectThreat(req);
  if (threat) {
    security("suspicious_request", {
      reason:    threat,
      method:    req.method,
      url:       req.originalUrl || req.url,
      ip:        req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      userId:    req.user?._id?.toString(),
      message:   `Suspicious request detected: ${threat}`,
    });
  }
  next();
};

// Replaces the default 404 handler — logs probing/scanning attempts.
const notFoundLogger = (req, res) => {
  security("not_found_probe", {
    reason:    "endpoint_not_found",
    method:    req.method,
    url:       req.originalUrl || req.url,
    ip:        req.ip || req.socket?.remoteAddress,
    userAgent: req.headers?.["user-agent"],
    userId:    req.user?._id?.toString(),
    message:   "Request to non-existent endpoint",
  });
  res.status(404).json({ error: "Endpoint not found" });
};

module.exports = { securityLogger, notFoundLogger };
