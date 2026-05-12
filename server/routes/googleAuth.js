const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");
const transporter = require("../config/email");
const { createPending, verifyOtp, getPending } = require("../services/otpService");
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

async function sendOtpEmail(email, otp) {
  await transporter.sendMail({
    from: `"Fun English" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Mã xác thực của bạn – Fun English",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#6366f1;margin-top:0;">🔐 Xác thực đăng nhập</h2>
        <p style="color:#334155;">Mã xác thực 2 bước của bạn là:</p>
        <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1e293b;text-align:center;
                    background:#e0e7ff;border-radius:8px;padding:20px 0;margin:24px 0;">
          ${otp}
        </div>
        <p style="color:#64748b;font-size:14px;">Mã có hiệu lực trong <strong>5 phút</strong>.<br/>
           Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
      </div>
    `,
  });
}

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

      const { otp, pendingToken } = createPending(user._id, user.email);
      await sendOtpEmail(user.email, otp);

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
    return res.status(400).json({ error: "Thiếu thông tin xác thực." });
  }

  const result = verifyOtp(pendingToken, code.trim());
  if (!result.valid) {
    return res.status(400).json({ error: result.reason });
  }

  try {
    const user = await User.findById(result.userId);
    if (!user) return res.status(404).json({ error: "Người dùng không tồn tại." });

    if (!user.isActive) {
      return res.status(403).json({ error: "Tài khoản đã bị vô hiệu hóa." });
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

// Resend OTP (generate a new code for an existing pending session)
router.post("/resend-code", async (req, res) => {
  const { pendingToken } = req.body;

  if (!pendingToken) {
    return res.status(400).json({ error: "Thiếu token phiên xác thực." });
  }

  const record = getPending(pendingToken);
  if (!record) {
    return res.status(400).json({ error: "Phiên xác thực không tồn tại hoặc đã hết hạn. Vui lòng đăng nhập lại." });
  }

  try {
    const { otp, pendingToken: newToken } = createPending(record.userId, record.email);
    await sendOtpEmail(record.email, otp);

    return res.json({ pendingToken: newToken });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Resend OTP error:", err.message);
    return res.status(500).json({ error: "Gửi email thất bại. Vui lòng thử lại." });
  }
});

module.exports = router;
