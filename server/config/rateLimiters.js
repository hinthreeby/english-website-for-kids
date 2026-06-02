const rateLimit = require("express-rate-limit");

// Lazily import to avoid circular dependency at module load time
function getSecurityLogger() {
  return require("./loggers").security;
}

const make = (windowMs, max, message, eventName) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res, next, options) {
      getSecurityLogger()("rate_limit_exceeded", {
        event: eventName || "rate_limit",
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers?.["user-agent"],
        message: `Rate limit hit: ${message}`,
      });
      res.status(options.statusCode).json(options.message);
    },
  });

// 10 login attempts per 15 min per IP
const loginLimiter = make(
  15 * 60 * 1000,
  10,
  "Too many login attempts. Please try again in 15 minutes.",
  "login_rate_limit"
);

// 5 register-init/register attempts per 15 min per IP
const registerLimiter = make(
  15 * 60 * 1000,
  5,
  "Too many registration attempts. Please try again in 15 minutes.",
  "register_rate_limit"
);

// 5 forgot-password / resend-otp per 15 min per IP
const forgotLimiter = make(
  15 * 60 * 1000,
  5,
  "Too many requests. Please try again in 15 minutes.",
  "forgot_rate_limit"
);

// 10 OTP verify attempts per 15 min per IP (login-verify, verify-reset-otp, register-verify, oauth verify-code)
const otpVerifyLimiter = make(
  15 * 60 * 1000,
  10,
  "Too many verification attempts. Please try again in 15 minutes.",
  "otp_verify_rate_limit"
);

// 3 OTP resend requests per 10 min per IP
const otpResendLimiter = make(
  10 * 60 * 1000,
  3,
  "Too many resend requests. Please wait before requesting another code.",
  "otp_resend_rate_limit"
);

// 20 quiz submissions per minute per IP
const submitLimiter = make(
  60 * 1000,
  20,
  "Too many submissions. Please slow down.",
  "submit_rate_limit"
);

// 60 video view increments per minute per IP
const viewLimiter = make(
  60 * 1000,
  60,
  "Too many requests. Please slow down.",
  "view_rate_limit"
);

// 30 AI drawing checks per minute per IP
const drawLimiter = make(
  60 * 1000,
  30,
  "Too many drawing checks. Please slow down.",
  "draw_rate_limit"
);

// 30 AI chat messages per minute per IP
const chatLimiter = make(
  60 * 1000,
  30,
  "Too many messages. Please slow down.",
  "chat_rate_limit"
);

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotLimiter,
  otpVerifyLimiter,
  otpResendLimiter,
  submitLimiter,
  viewLimiter,
  drawLimiter,
  chatLimiter,
};
