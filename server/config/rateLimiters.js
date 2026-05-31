const rateLimit = require("express-rate-limit");

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// 10 login attempts per 15 min per IP
const loginLimiter = make(
  15 * 60 * 1000,
  10,
  "Too many login attempts. Please try again in 15 minutes."
);

// 5 register-init/register attempts per 15 min per IP
const registerLimiter = make(
  15 * 60 * 1000,
  5,
  "Too many registration attempts. Please try again in 15 minutes."
);

// 5 forgot-password / resend-otp per 15 min per IP
const forgotLimiter = make(
  15 * 60 * 1000,
  5,
  "Too many requests. Please try again in 15 minutes."
);

// 20 quiz submissions per minute per IP
const submitLimiter = make(
  60 * 1000,
  20,
  "Too many submissions. Please slow down."
);

// 60 video view increments per minute per IP
const viewLimiter = make(
  60 * 1000,
  60,
  "Too many requests. Please slow down."
);

// 30 AI drawing checks per minute per IP
const drawLimiter = make(
  60 * 1000,
  30,
  "Too many drawing checks. Please slow down."
);

// 30 AI chat messages per minute per IP
const chatLimiter = make(
  60 * 1000,
  30,
  "Too many messages. Please slow down."
);

module.exports = { loginLimiter, registerLimiter, forgotLimiter, submitLimiter, viewLimiter, drawLimiter, chatLimiter };
