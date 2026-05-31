const logger = require("./logger");

// Typed log helpers — each injects the correct "type" field for ELK filtering.

const auth = (level, event, data) =>
  logger[level]({ type: "auth", event, ...data }, data.message || event);

const security = (event, data) =>
  logger.warn({ type: "security", event, ...data }, data.reason || event);

const activity = (event, data) =>
  logger.info({ type: "activity", event, ...data }, data.message || event);

const admin = (event, data) =>
  logger.info({ type: "admin", event, ...data }, data.message || event);

const db = (level, event, data) =>
  logger[level]({ type: "database", event, ...data }, data.message || event);

const perf = (level, event, data) =>
  logger[level]({ type: "performance", event, ...data }, data.message || event);

module.exports = { auth, security, activity, admin, db, perf };
