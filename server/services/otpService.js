const crypto = require("crypto");

// pendingToken -> { userId, email, otpHash, expiresAt, purpose, attempts, ...extraData }
const pendingStore = new Map();

// resetToken -> { userId, expiresAt }
const resetTokenStore = new Map();

const OTP_TTL_MS = 5 * 60 * 1000;       // 5 minutes
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * @param {string|null} userId
 * @param {string} email
 * @param {"register"|"login-2fa"|"reset"} purpose
 * @param {object} extraData  additional fields stored with the record
 */
function createPending(userId, email, purpose = "login-2fa", extraData = {}) {
  const otp = generateOtp();
  const pendingToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + OTP_TTL_MS;

  pendingStore.set(pendingToken, {
    userId: userId ? userId.toString() : null,
    email,
    otpHash: hashOtp(otp),
    expiresAt,
    purpose,
    attempts: 0,
    ...extraData,
  });

  return { otp, pendingToken };
}

/**
 * Verify an OTP.
 * - Increments attempt counter on wrong code.
 * - Deletes the record (locks out) after MAX_OTP_ATTEMPTS failures.
 * - On success, removes the record and returns the stored data.
 */
function verifyOtp(pendingToken, otp) {
  const record = pendingStore.get(pendingToken);
  if (!record) return { valid: false, reason: "Invalid or expired code." };

  if (Date.now() > record.expiresAt) {
    pendingStore.delete(pendingToken);
    return { valid: false, reason: "Code has expired. Please request a new one." };
  }

  if (record.otpHash !== hashOtp(otp)) {
    record.attempts = (record.attempts || 0) + 1;

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      pendingStore.delete(pendingToken);
      return {
        valid: false,
        reason: "Too many incorrect attempts. Please request a new verification code.",
        locked: true,
      };
    }

    const remaining = MAX_OTP_ATTEMPTS - record.attempts;
    return {
      valid: false,
      reason: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  const { otpHash, expiresAt, attempts, ...rest } = record;
  pendingStore.delete(pendingToken);
  return { valid: true, ...rest };
}

function getPending(pendingToken) {
  return pendingStore.get(pendingToken) || null;
}

// ── Reset-token helpers ───────────────────────────────────────────────────────

function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  resetTokenStore.set(token, {
    userId: userId.toString(),
    expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
  });
  return token;
}

/** Consume (one-time use) a reset token.  Returns userId string or null. */
function consumeResetToken(token) {
  const record = resetTokenStore.get(token);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    resetTokenStore.delete(token);
    return null;
  }
  resetTokenStore.delete(token);
  return record.userId;
}

module.exports = { createPending, verifyOtp, getPending, createResetToken, consumeResetToken };
