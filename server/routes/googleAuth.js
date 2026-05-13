const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");
const { createPending, verifyOtp, getPending } = require("../services/otpService");
const { sendOtpEmail } = require("../services/emailService");
const User = require("../models/User");

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const buildCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// Step 1: redirect to Google consent screen
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Step 2: Google redirects here after user consents
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login?error=google_failed`,
    session: true,
  }),
  async (req, res) => {
    try {
      const user = req.user;

      if (!user.email) {
        return res.redirect(`${CLIENT_URL}/login?error=no_email`);
      }

      const { otp, pendingToken } = createPending(user._id, user.email, "login-2fa");
      await sendOtpEmail(user.email, otp, "login-2fa");

      return res.redirect(`${CLIENT_URL}/oauth/verify?token=${pendingToken}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("OTP send error:", err.message);
      return res.redirect(`${CLIENT_URL}/login?error=email_failed`);
    }
  }
);

// Step 3: Verify OTP code submitted by user
router.post("/verify-code", async (req, res) => {
  const { pendingToken, code } = req.body;

  if (!pendingToken || !code) {
    return res.status(400).json({ error: "Missing verification data." });
  }

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) {
    return res.status(400).json({ error: result.reason });
  }

  try {
    const user = await User.findById(result.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!user.isActive) {
      return res.status(403).json({ error: "Your account has been disabled." });
    }

    const token = signToken(user._id);
    res.cookie("token", token, buildCookieOptions());

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
        totalStars: user.totalStars,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Resend OTP for Google OAuth verify page
router.post("/resend-code", async (req, res) => {
  const { pendingToken } = req.body;

  if (!pendingToken) {
    return res.status(400).json({ error: "Missing session token." });
  }

  const record = getPending(pendingToken);
  if (!record) {
    return res.status(400).json({ error: "Session not found or expired. Please log in again." });
  }

  try {
    const { otp, pendingToken: newToken } = createPending(record.userId, record.email, "login-2fa");
    await sendOtpEmail(record.email, otp, "login-2fa");
    return res.json({ pendingToken: newToken });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Resend OTP error:", err.message);
    return res.status(500).json({ error: "Failed to send email. Please try again." });
  }
});

module.exports = router;
