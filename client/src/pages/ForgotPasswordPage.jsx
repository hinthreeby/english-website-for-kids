import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import earthImg from "../assets/general/planet/earth.png";
import jupiterImg from "../assets/general/planet/jupiter.png";
import planetImg from "../assets/general/planet/planet.png";
import starImg from "../assets/general/star/star.png";
import api from "../lib/api";
import useSound from "../hooks/useSound";

const STAR_COUNT = 20;
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const SpaceDecorations = () => (
  <>
    <div className="space-stars star-field" aria-hidden="true">
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <img key={i} src={starImg} className={`space-star space-star-${i}`} alt="" />
      ))}
    </div>
    <img src={earthImg} alt="" className="planet earth" aria-hidden="true" />
    <img src={jupiterImg} alt="" className="planet jupiter" aria-hidden="true" />
    <img src={planetImg} alt="" className="planet planet-red" aria-hidden="true" />
    <div className="shooting shooting-1" aria-hidden="true" />
    <div className="shooting shooting-2" aria-hidden="true" />
  </>
);

const OTP_INPUT_STYLE = (error, digit) => ({
  width: "50px",
  height: "56px",
  textAlign: "center",
  fontSize: "1.6rem",
  fontWeight: "700",
  borderRadius: "10px",
  border: `2px solid ${error ? "#f87171" : digit ? "#6366f1" : "#cbd5e1"}`,
  outline: "none",
  background: "#fff",
  color: "#1e293b",
  padding: "0",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
});

const ForgotPasswordPage = () => {
  const { playPop, playChime } = useSound();
  const navigate = useNavigate();

  // step: "email" | "otp" | "reset" | "done"
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [passwords, setPasswords] = useState({ newPassword: "", confirmNewPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const focusInput = (index) => inputRefs.current[index]?.focus();

  // ── Step 1: enter email ─────────────────────────────────────────────────────

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    playPop();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email: email.trim() });
      setPendingToken(res.data.pendingToken);
      setStep("otp");
      setTimeout(() => focusInput(0), 100);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: enter OTP ───────────────────────────────────────────────────────

  const handleDigitChange = (index, value) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");
    if (char && index < CODE_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) focusInput(index - 1);
    if (e.key === "ArrowLeft" && index > 0) focusInput(index - 1);
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) focusInput(index + 1);
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify-reset-otp", { pendingToken, code });
      setResetToken(res.data.resetToken);
      setStep("reset");
    } catch (err) {
      setError(err?.response?.data?.error || "Verification failed. Please try again.");
      setDigits(Array(CODE_LENGTH).fill(""));
      focusInput(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/resend-otp", { pendingToken });
      setPendingToken(res.data.pendingToken);
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCooldown(RESEND_COOLDOWN);
      focusInput(0);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Step 3: enter new password ──────────────────────────────────────────────

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    playPop();
    setError("");
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (passwords.newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        resetToken,
        newPassword: passwords.newPassword,
        confirmNewPassword: passwords.confirmNewPassword,
      });
      playChime();
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="auth-page">
        <SpaceDecorations />
        <div className="auth-card" style={{ gap: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <h2 style={{ margin: 0 }}>Password Reset!</h2>
          <p className="subtitle">Your password has been updated successfully.</p>
          <button className="btn-primary" onClick={() => navigate("/login", { replace: true })}>
            🔐 Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <div className="auth-page">
        <SpaceDecorations />
        <form className="auth-card" onSubmit={handleResetSubmit} style={{ gap: "1rem" }}>
          <h2>🔑 Set New Password</h2>
          <p className="subtitle">Choose a strong new password.</p>

          <input
            type="password"
            placeholder="New password (min 4 characters)"
            minLength={4}
            value={passwords.newPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            minLength={4}
            value={passwords.confirmNewPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, confirmNewPassword: e.target.value }))}
            required
          />

          {error ? <p className="error-text auth-error">{error}</p> : null}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "✅ Reset Password"}
          </button>

          <Link className="auth-back-link" to="/login">
            ← Back to Login
          </Link>
        </form>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="auth-page">
        <SpaceDecorations />
        <form className="auth-card" onSubmit={handleOtpSubmit} style={{ gap: "1rem" }}>
          <h2>📧 Check Your Email</h2>
          <p className="subtitle" style={{ marginBottom: "0.25rem" }}>
            A 6-digit reset code was sent to <strong>{email}</strong>.
          </p>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
            Code expires in 5 minutes.
          </p>

          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "0.5rem 0" }}
            onPaste={handlePaste}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={OTP_INPUT_STYLE(error, digit)}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error ? <p className="error-text auth-error">{error}</p> : null}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading || digits.join("").length < CODE_LENGTH}
          >
            {loading ? "Verifying..." : "✅ Verify Code"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            style={{ fontSize: "0.9rem" }}
          >
            {resendLoading
              ? "Sending..."
              : resendCooldown > 0
              ? `Resend code (${resendCooldown}s)`
              : "🔄 Resend code"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setStep("email"); setError(""); setDigits(Array(CODE_LENGTH).fill("")); }}
            style={{ fontSize: "0.85rem", opacity: 0.7 }}
          >
            ← Change email
          </button>
        </form>
      </div>
    );
  }

  // step === "email"
  return (
    <div className="auth-page">
      <SpaceDecorations />
      <form className="auth-card" onSubmit={handleEmailSubmit}>
        <h2>🔑 Forgot Password</h2>
        <p className="subtitle">Enter your account email and we&apos;ll send you a reset code.</p>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error ? <p className="error-text auth-error">{error}</p> : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Sending..." : "📧 Send Reset Code"}
        </button>

        <Link
          className="btn-secondary"
          to="/login"
          onClick={playPop}
          style={{ textAlign: "center", display: "block" }}
        >
          ← Back to Login
        </Link>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
