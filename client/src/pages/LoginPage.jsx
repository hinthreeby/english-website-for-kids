import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import earthImg from "../assets/general/planet/earth.png";
import jupiterImg from "../assets/general/planet/jupiter.png";
import planetImg from "../assets/general/planet/planet.png";
import starImg from "../assets/general/star/star.png";
import { useAuth, LOGIN_KEY, getDeviceId } from "../context/AuthContext";
import api from "../lib/api";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";
import { getRoleHome } from "../lib/roleHome";

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

const LoginPage = () => {
  const { login, setUser } = useAuth();
  const { mergeGuestStars } = useProgress();
  const { playPop, playChime } = useSound();
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials"); // "credentials" | "2fa"
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [pendingToken, setPendingToken] = useState("");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const focusInput = (index) => inputRefs.current[index]?.focus();

  // ── Step 1: credentials ─────────────────────────────────────────────────────

  const handleCredentialSubmit = async (event) => {
    event.preventDefault();
    playPop();
    setError("");
    setLoading(true);

    try {
      const result = await login({
        identifier: form.identifier.trim(),
        username: form.identifier.trim(),
        password: form.password,
      });

      if (result?.requiresTwoFactor) {
        setPendingToken(result.pendingToken);
        setStep("2fa");
        setTimeout(() => focusInput(0), 100);
        return;
      }

      // Direct login success
      const loggedInUser = result;
      if (loggedInUser?.role === "child") {
        await mergeGuestStars();
      }
      playChime();
      navigate(getRoleHome(loggedInUser?.role), { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: 2FA OTP verification ────────────────────────────────────────────

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

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const deviceId = getDeviceId();
      const res = await api.post("/api/auth/login-verify", { pendingToken, code, deviceId });
      const loggedInUser = res.data.user;
      setUser(loggedInUser);
      sessionStorage.setItem(LOGIN_KEY, "true");
      playChime();
      navigate(getRoleHome(loggedInUser?.role), { replace: true });
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
      const res = await api.post("/api/auth/resend-otp", { pendingToken });
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

  // ── Render: 2FA step ────────────────────────────────────────────────────────

  if (step === "2fa") {
    return (
      <div className="auth-page">
        <SpaceDecorations />
        <form className="auth-card" onSubmit={handle2FASubmit} style={{ gap: "1rem" }}>
          <h2>🔐 Two-Factor Authentication</h2>
          <p className="subtitle" style={{ marginBottom: "0.25rem" }}>
            A verification code was sent to your email.
          </p>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
            Code expires in 5 minutes. This device will be remembered after verification.
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
            {loading ? "Verifying..." : "✅ Confirm"}
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
            onClick={() => { setStep("credentials"); setError(""); setDigits(Array(CODE_LENGTH).fill("")); }}
            style={{ fontSize: "0.85rem", opacity: 0.7 }}
          >
            ← Back to Login
          </button>
        </form>
      </div>
    );
  }

  // ── Render: credentials step ────────────────────────────────────────────────

  return (
    <div className="auth-page">
      <SpaceDecorations />

      <form className="auth-card" onSubmit={handleCredentialSubmit}>
        <h2>🔐 Log In</h2>
        <p className="subtitle">Welcome back, little explorer!</p>

        <input
          placeholder="Email or Username"
          value={form.identifier}
          minLength={2}
          onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
          required
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          minLength={4}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />

        <div style={{ textAlign: "right", marginTop: "-0.25rem" }}>
          <Link
            to="/forgot-password"
            style={{ color: "#6366f1", fontSize: "0.85rem", textDecoration: "none" }}
            onClick={playPop}
          >
            Forgot password?
          </Link>
        </div>

        {error ? <p className="error-text auth-error">{error}</p> : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Loading..." : "🔐 Log in"}
        </button>

        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playPop();
            navigate("/register");
          }}
        >
          ✨ Need an account?
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <a className="btn-google" href="/auth/google" onClick={playPop}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign in with Google
        </a>

        <Link className="auth-back-link" to="/" onClick={playPop}>
          ← Back to Home
        </Link>
      </form>
    </div>
  );
};

export default LoginPage;
