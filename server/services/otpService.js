const crypto = require("crypto");

// pendingToken -> { userId, email, otpHash, expiresAt }
const pendingStore = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function createPending(userId, email) {
  const otp = generateOtp();
  const pendingToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + OTP_TTL_MS;

  pendingStore.set(pendingToken, {
    userId: userId.toString(),
    email,
    otpHash: hashOtp(otp),
    expiresAt,
  });

  return { otp, pendingToken };
}

function verifyOtp(pendingToken, otp) {
  const record = pendingStore.get(pendingToken);
  if (!record) return { valid: false, reason: "Mã không hợp lệ hoặc đã hết hạn." };

  if (Date.now() > record.expiresAt) {
    pendingStore.delete(pendingToken);
    return { valid: false, reason: "Mã đã hết hạn. Vui lòng yêu cầu mã mới." };
  }

  if (record.otpHash !== hashOtp(otp)) {
    return { valid: false, reason: "Mã xác thực không đúng." };
  }

  const { userId } = record;
  pendingStore.delete(pendingToken);
  return { valid: true, userId };
}

function getPending(pendingToken) {
  return pendingStore.get(pendingToken) || null;
}

module.exports = { createPending, verifyOtp, getPending };
