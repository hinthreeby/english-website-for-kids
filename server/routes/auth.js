const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { getDayGap } = require("../services/streakService");
const { createPending, verifyOtp, getPending, createResetToken, consumeResetToken } = require("../services/otpService");
const { sendOtpEmail } = require("../services/emailService");
const env = require("../config/env");
const { cookieOptions } = require("../config/cookies");
const { loginLimiter, registerLimiter, forgotLimiter, otpVerifyLimiter, otpResendLimiter } = require("../config/rateLimiters");
const { validatePassword } = require("../utils/passwordPolicy");
const { auth } = require("../config/loggers");

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

const signToken = (id) => jwt.sign({ id }, env.JWT_SECRET, { expiresIn: "7d" });

const sendToken = (user, res) => {
  const token = signToken(user._id);
  res.cookie("token", token, cookieOptions);
  return token;
};

function deviceHash(deviceId) {
  return crypto.createHash("sha256").update(deviceId).digest("hex");
}

function buildUserPayload(user) {
  return {
    id: user._id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    email: user.email,
    avatar: user.avatar,
    totalStars: user.totalStars,
    currentStreak: user.currentStreak,
    isApproved: user.isApproved,
    children: user.children,
    planetsUnlocked: user.planetsUnlocked,
  };
}

// ── Registration (2-step with OTP) ───────────────────────────────────────────

router.post("/register-init", registerLimiter, async (req, res) => {
  console.log("REGISTER INIT START");

  const { username, email, password, confirmPassword, role } = req.body;
  const requestedRole = role || "parent";

  if (!["parent", "teacher"].includes(requestedRole))
    return res.status(400).json({ error: "Invalid role." });
  if (!username?.trim())
    return res.status(400).json({ error: "Username is required." });
  if (!email?.trim())
    return res.status(400).json({ error: "Email is required." });
  if (!password)
    return res.status(400).json({ error: "Password is required." });
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  if (password !== confirmPassword)
    return res.status(400).json({ error: "Passwords do not match." });

  try {
    const usernameTrimmed = username.trim();
    const emailTrimmed = email.trim().toLowerCase();

    const existsByUsername = await User.findOne({ username: usernameTrimmed });
    if (existsByUsername)
      return res.status(400).json({ error: "Username is already taken." });

    const existsByEmail = await User.findOne({ email: emailTrimmed });
    if (existsByEmail)
      return res.status(400).json({ error: "Email is already registered." });

    const { otp, pendingToken } = createPending(null, emailTrimmed, "register", {
      username: usernameTrimmed,
      role: requestedRole,
      passwordPlain: password,
    });

    console.log("[REGISTER] Attempting to send OTP", { email: emailTrimmed });
    try {
      await sendOtpEmail(emailTrimmed, otp, "register");
      console.log("[REGISTER] OTP sent successfully");
    } catch (emailErr) {
      console.error("[REGISTER] Email sending failed:", emailErr.message);
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Failed to send verification email. Please check your email address or try again later." });
      }
      console.warn(`[REGISTER][DEV] OTP for ${emailTrimmed}: ${otp}`);
    }

    return res.json({ pendingToken });
  } catch (err) {
    console.error("[REGISTER-INIT] Error:", err.message);
    return res.status(500).json({ error: err.message || "Registration failed. Please try again." });
  }
});

router.post("/register-verify", otpVerifyLimiter, async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code)
    return res.status(400).json({ error: "Missing verification data." });

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) {
    auth("warn", "otp_failed", {
      purpose: "register",
      reason: result.locked ? "otp_locked" : "otp_incorrect",
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      message: result.reason,
    });
    return res.status(400).json({ error: result.reason });
  }
  if (result.purpose !== "register")
    return res.status(400).json({ error: "Invalid token type." });

  try {
    const { email, username, role, passwordPlain } = result;

    // Double-check uniqueness (race condition safety)
    const existsByUsername = await User.findOne({ username });
    if (existsByUsername)
      return res.status(400).json({ error: "Username is already taken." });
    const existsByEmail = await User.findOne({ email });
    if (existsByEmail)
      return res.status(400).json({ error: "Email is already registered." });

    const user = await User.create({
      username,
      email,
      password: passwordPlain,
      role,
      displayName: username,
      isApproved: true,
    });

    auth("info", "register_success", {
      userId:    user._id.toString(),
      email:     user.email,
      role:      user.role,
      ip:        req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      message:   `New user registered: ${user.username}`,
    });

    sendToken(user, res);
    return res.status(201).json({ user: buildUserPayload(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Legacy register (kept for backward compatibility with existing AuthContext.register())
router.post("/register", registerLimiter, async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ error: "Request body is required." });
  }

  const { username, password, role, email, confirmPassword } = req.body;
  const requestedRole = role || "parent";

  if (!["parent", "teacher"].includes(requestedRole))
    return res.status(400).json({ error: "Invalid role." });
  if (!username?.trim())
    return res.status(400).json({ error: "Username is required." });
  if (!email?.trim())
    return res.status(400).json({ error: "Email is required." });
  if (!password)
    return res.status(400).json({ error: "Password is required." });
  const pwErrLegacy = validatePassword(password);
  if (pwErrLegacy) return res.status(400).json({ error: pwErrLegacy });
  if (confirmPassword !== undefined && password !== confirmPassword)
    return res.status(400).json({ error: "Passwords do not match." });

  try {
    const usernameTrimmed = username.trim();
    const emailTrimmed = email.trim().toLowerCase();

    const existsByUsername = await User.findOne({ username: usernameTrimmed });
    if (existsByUsername)
      return res.status(400).json({ error: "Username is already taken." });
    const existsByEmail = await User.findOne({ email: emailTrimmed });
    if (existsByEmail)
      return res.status(400).json({ error: "Email is already registered." });

    const user = await User.create({
      username: usernameTrimmed,
      password,
      role: requestedRole,
      email: emailTrimmed,
      displayName: usernameTrimmed,
      isApproved: true,
    });

    auth("info", "register_success", {
      userId:    user._id.toString(),
      email:     user.email,
      role:      user.role,
      ip:        req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      message:   `New user registered (legacy): ${user.username}`,
    });

    sendToken(user, res);
    return res.status(201).json({ user: buildUserPayload(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Login (with trusted-device check + optional 2FA) ─────────────────────────

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password, identifier, deviceId } = req.body;
  const loginIdentifier = (username || identifier || "").trim();

  if (!loginIdentifier || !password)
    return res.status(400).json({ error: "Email/username and password are required." });

  const ip        = req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers?.["user-agent"];

  try {
    const normalizedEmail = loginIdentifier.toLowerCase();
    const user = await User.findOne({
      $or: [{ username: loginIdentifier }, { email: normalizedEmail }],
    });

    if (!user) {
      auth("warn", "login_failed", {
        reason:     "user_not_found",
        identifier: loginIdentifier,
        ip,
        userAgent,
        message:    "Login failed: user not found",
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      auth("warn", "login_failed", {
        reason:    "invalid_password",
        email:     user.email,
        userId:    user._id.toString(),
        ip,
        userAgent,
        message:   "Login failed: wrong password",
      });
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (!user.isActive) {
      auth("warn", "login_failed", {
        reason:    "account_disabled",
        email:     user.email,
        userId:    user._id.toString(),
        ip,
        userAgent,
        message:   "Login failed: account disabled",
      });
      return res.status(403).json({ error: "Your account has been disabled." });
    }

    // Children and accounts without email skip 2FA
    const skip2FA = user.role === "child" || !user.email;

    if (!skip2FA) {
      if (deviceId) {
        const hash = deviceHash(deviceId);
        const trusted = user.trustedDevices?.some((d) => d.tokenHash === hash);
        if (trusted) {
          // Trusted device → direct login
          return await doDirectLogin(user, req, res, false);
        }
      }
      // New device → send 2FA OTP
      const { otp, pendingToken } = createPending(user._id, user.email, "login-2fa", {
        deviceId: deviceId || null,
      });
      console.log("[LOGIN] Sending 2FA code to:", user.email);
      try {
        await sendOtpEmail(user.email, otp, "login-2fa");
        console.log("[LOGIN] 2FA code sent successfully");
      } catch (emailErr) {
        console.error("[LOGIN] Email sending failed:", emailErr.message);
        if (process.env.NODE_ENV === "production") {
          return res.status(500).json({ error: "Failed to send login code. Please try again or use a trusted device." });
        }
        console.warn(`[LOGIN][DEV] OTP for ${user.email}: ${otp}`);
      }
      return res.json({ requiresTwoFactor: true, pendingToken });
    }

    // Skip 2FA path
    return await doDirectLogin(user, req, res, user.role === "child");
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

async function doDirectLogin(user, req, res, checkStreak) {
  const loginUpdate = { lastLogin: new Date() };
  let streakReset = false;
  if (checkStreak && user.lastPlayedDate) {
    const dayGap = getDayGap(user.lastPlayedDate, new Date());
    if (dayGap >= 2) {
      loginUpdate.currentStreak = 0;
      streakReset = true;
    }
  }
  const updatedUser = await User.findByIdAndUpdate(user._id, loginUpdate, { new: true });

  auth("info", "login_success", {
    userId:    updatedUser._id.toString(),
    email:     updatedUser.email,
    role:      updatedUser.role,
    ip:        req.ip || req.socket?.remoteAddress,
    userAgent: req.headers?.["user-agent"],
    message:   `User ${updatedUser.username} logged in`,
  });

  sendToken(updatedUser, res);
  return res.json({ user: buildUserPayload(updatedUser), streakReset });
}

router.post("/login-verify", otpVerifyLimiter, async (req, res) => {
  const { pendingToken, code, deviceId } = req.body;
  if (!pendingToken || !code)
    return res.status(400).json({ error: "Missing verification data." });

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) {
    auth("warn", "otp_failed", {
      purpose: "login-2fa",
      reason: result.locked ? "otp_locked" : "otp_incorrect",
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      message: result.reason,
    });
    return res.status(400).json({ error: result.reason });
  }
  if (result.purpose !== "login-2fa")
    return res.status(400).json({ error: "Invalid token type." });

  try {
    const user = await User.findById(result.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (!user.isActive)
      return res.status(403).json({ error: "Your account has been disabled." });

    const effectiveDeviceId = deviceId || result.deviceId;

    // Mark device as trusted (keep last 10)
    if (effectiveDeviceId) {
      const hash = deviceHash(effectiveDeviceId);
      await User.findByIdAndUpdate(user._id, {
        $push: { trustedDevices: { $each: [{ tokenHash: hash }], $slice: -10 } },
      });
    }

    const loginUpdate = { lastLogin: new Date() };
    let streakReset = false;
    if (user.role === "child" && user.lastPlayedDate) {
      const dayGap = getDayGap(user.lastPlayedDate, new Date());
      if (dayGap >= 2) {
        loginUpdate.currentStreak = 0;
        streakReset = true;
      }
    }
    const updatedUser = await User.findByIdAndUpdate(user._id, loginUpdate, { new: true });

    auth("info", "login_success", {
      userId:    updatedUser._id.toString(),
      email:     updatedUser.email,
      role:      updatedUser.role,
      ip:        req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      message:   `User ${updatedUser.username} logged in (2FA verified)`,
    });

    sendToken(updatedUser, res);
    return res.json({ user: buildUserPayload(updatedUser), streakReset, deviceId: effectiveDeviceId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Resend OTP (for register / login-2fa / reset flows) ──────────────────────

router.post("/resend-otp", otpResendLimiter, async (req, res) => {
  const { pendingToken } = req.body;
  if (!pendingToken)
    return res.status(400).json({ error: "Missing pending token." });

  const record = getPending(pendingToken);
  if (!record)
    return res.status(400).json({ error: "Session not found or expired. Please start over." });

  try {
    const { userId, email, purpose = "login-2fa", username, role, passwordPlain, deviceId } = record;
    const { otp, pendingToken: newToken } = createPending(userId, email, purpose, {
      username,
      role,
      passwordPlain,
      deviceId,
    });
    console.log("[RESEND-OTP] Resending OTP to:", email, "(purpose:", purpose + ")");
    try {
      await sendOtpEmail(email, otp, purpose);
      console.log("[RESEND-OTP] OTP resent successfully");
    } catch (emailErr) {
      console.error("[RESEND-OTP] Email sending failed:", emailErr.message);
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Failed to resend verification code. Please try again later." });
      }
      console.warn(`[RESEND-OTP][DEV] OTP for ${email}: ${otp}`);
    }
    return res.json({ pendingToken: newToken });
  } catch (err) {
    console.error("[RESEND-OTP] Unexpected error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Forgot Password ───────────────────────────────────────────────────────────

router.post("/forgot-password", forgotLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email?.trim())
    return res.status(400).json({ error: "Email is required." });

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res.status(404).json({ error: "No account found with this email address." });
    if (!user.password)
      return res.status(400).json({
        error: "This account uses Google Sign-In. Please log in with Google.",
      });

    const { otp, pendingToken } = createPending(user._id, user.email, "reset");
    console.log("[FORGOT-PASSWORD] Sending password reset OTP to:", user.email);
    try {
      await sendOtpEmail(user.email, otp, "reset");
      console.log("[FORGOT-PASSWORD] Reset OTP sent successfully");
    } catch (emailErr) {
      console.error("[FORGOT-PASSWORD] Email sending failed:", emailErr.message);
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Failed to send password reset code. Please try again later." });
      }
      console.warn(`[FORGOT-PASSWORD][DEV] OTP for ${user.email}: ${otp}`);
    }
    return res.json({ pendingToken });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/verify-reset-otp", otpVerifyLimiter, async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code)
    return res.status(400).json({ error: "Missing verification data." });

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) {
    auth("warn", "otp_failed", {
      purpose: "reset",
      reason: result.locked ? "otp_locked" : "otp_incorrect",
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
      message: result.reason,
    });
    return res.status(400).json({ error: result.reason });
  }
  if (result.purpose !== "reset")
    return res.status(400).json({ error: "Invalid token type." });

  const resetToken = createResetToken(result.userId);
  return res.json({ resetToken });
});

router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword, confirmNewPassword } = req.body;
  if (!resetToken)
    return res.status(400).json({ error: "Missing reset token." });
  if (!newPassword)
    return res.status(400).json({ error: "Password is required." });
  const pwErrReset = validatePassword(newPassword);
  if (pwErrReset) return res.status(400).json({ error: pwErrReset });
  if (newPassword !== confirmNewPassword)
    return res.status(400).json({ error: "Passwords do not match." });

  const userId = consumeResetToken(resetToken);
  if (!userId)
    return res.status(400).json({ error: "Reset link has expired. Please request a new one." });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    user.password = newPassword;
    await user.save(); // triggers bcrypt hash via pre-save hook
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Parent switch-child ───────────────────────────────────────────────────────

router.post("/switch-child", protect, async (req, res) => {
  try {
    const { childId } = req.body;
    if (req.user.role !== "parent")
      return res.status(403).json({ error: "Only parents can switch to child profile." });

    const child = await User.findById(childId);
    if (!child || child.parentId?.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not your child account." });

    sendToken(child, res);
    return res.json({ user: buildUserPayload(child) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Session ───────────────────────────────────────────────────────────────────

router.get("/me", protect, async (req, res) => {
  return res.json({ user: req.user });
});

router.post("/logout", (req, res) => {
  auth("info", "logout", {
    ip:        req.ip || req.socket?.remoteAddress,
    userAgent: req.headers?.["user-agent"],
    message:   "User logged out",
  });
  res.clearCookie("token", cookieOptions);
  return res.json({ success: true });
});

module.exports = router;
