const pino = require("pino");
const path = require("path");
const fs = require("fs");
const env = require("./env");

// Auto-create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = pino(
  {
    messageKey: "message",
    base: {
      service: "english-learning-api",
      environment: env.NODE_ENV,
    },
    // Use "timestamp" key instead of pino's default "time"
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    level: env.isProduction ? "info" : "debug",
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  pino.multistream([
    { stream: process.stdout },
    { stream: pino.destination(path.join(logsDir, "app.log")) },
  ])
);

module.exports = logger;
