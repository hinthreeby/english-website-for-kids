const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const { getDayGap } = require("../services/streakService");
const { createPending, verifyOtp, getPending, createResetToken, consumeResetToken } = require("../services/otpService");
const { sendOtpEmail } = require("../services/emailService");

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const sendToken = (user, res) => {
  const token = signToken(user._id);
  res.cookie("token", token, buildCookieOptions());
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

router.post("/register-init", async (req, res) => {
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
  if (password.length < 4)
    return res.status(400).json({ error: "Password must be at least 4 characters." });
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

    console.log("before send mail", { email: emailTrimmed, otp });
    await sendOtpEmail(emailTrimmed, otp, "register");
    console.log("after send mail");
    
    return res.json({ pendingToken });
  } catch (err) {
    console.error("REGISTER INIT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/register-verify", async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code)
    return res.status(400).json({ error: "Missing verification data." });

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) return res.status(400).json({ error: result.reason });
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
      isApproved: role !== "teacher",
    });

    sendToken(user, res);
    return res.status(201).json({ user: buildUserPayload(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Legacy register (kept for backward compatibility with existing AuthContext.register())
router.post("/register", async (req, res) => {
  // Check if body exists
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
      isApproved: requestedRole !== "teacher",
    });

    sendToken(user, res);
    return res.status(201).json({ user: buildUserPayload(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Login (with trusted-device check + optional 2FA) ─────────────────────────

router.post("/login", async (req, res) => {
  const { username, password, identifier, deviceId } = req.body;
  const loginIdentifier = (username || identifier || "").trim();

  if (!loginIdentifier || !password)
    return res.status(400).json({ error: "Email/username and password are required." });

  try {
    const normalizedEmail = loginIdentifier.toLowerCase();
    const user = await User.findOne({
      $or: [{ username: loginIdentifier }, { email: normalizedEmail }],
    });

    if (!user) {
      const isEmail = loginIdentifier.includes("@");
      return res.status(401).json({
        error: isEmail
          ? "Email is not registered. Please sign up first."
          : "Invalid username or password.",
      });
    }

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Incorrect password." });

    if (!user.isActive)
      return res.status(403).json({ error: "Your account has been disabled." });

    if (user.role === "teacher" && !user.isApproved) {
      return res.status(403).json({
        error: "PENDING_APPROVAL",
        message: "Your teacher account is pending admin approval.",
      });
    }

    // Children and accounts without email skip 2FA
    const skip2FA = user.role === "child" || !user.email;

    if (!skip2FA) {
      if (deviceId) {
        const hash = deviceHash(deviceId);
        const trusted = user.trustedDevices?.some((d) => d.tokenHash === hash);
        if (trusted) {
          // Trusted device → direct login
          return await doDirectLogin(user, res, false);
        }
      }
      // New device → send 2FA OTP
      const { otp, pendingToken } = createPending(user._id, user.email, "login-2fa", {
        deviceId: deviceId || null,
      });
      await sendOtpEmail(user.email, otp, "login-2fa");
      return res.json({ requiresTwoFactor: true, pendingToken });
    }

    // Skip 2FA path
    return await doDirectLogin(user, res, user.role === "child");
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

async function doDirectLogin(user, res, checkStreak) {
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
  sendToken(updatedUser, res);
  return res.json({ user: buildUserPayload(updatedUser), streakReset });
}

router.post("/login-verify", async (req, res) => {
  const { pendingToken, code, deviceId } = req.body;
  if (!pendingToken || !code)
    return res.status(400).json({ error: "Missing verification data." });

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) return res.status(400).json({ error: result.reason });
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

    sendToken(updatedUser, res);
    return res.json({ user: buildUserPayload(updatedUser), streakReset, deviceId: effectiveDeviceId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Resend OTP (for register / login-2fa / reset flows) ──────────────────────

router.post("/resend-otp", async (req, res) => {
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
    await sendOtpEmail(email, otp, purpose);
    return res.json({ pendingToken: newToken });
  } catch {
    return res.status(500).json({ error: "Failed to send email. Please try again." });
  }
});

// ── Forgot Password ───────────────────────────────────────────────────────────

router.post("/forgot-password", async (req, res) => {
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
    await sendOtpEmail(user.email, otp, "reset");
    return res.json({ pendingToken });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/verify-reset-otp", async (req, res) => {
  const { pendingToken, code } = req.body;
  if (!pendingToken || !code)
    return res.status(400).json({ error: "Missing verification data." });

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) return res.status(400).json({ error: result.reason });
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
  if (newPassword.length < 4)
    return res.status(400).json({ error: "Password must be at least 4 characters." });
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

router.post("/logout", (_req, res) => {
  res.clearCookie("token", buildCookieOptions());
  return res.json({ success: true });
});

module.exports = router;
