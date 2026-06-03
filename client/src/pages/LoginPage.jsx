import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, LOGIN_KEY, getDeviceId } from "../context/AuthContext";
import api from "../lib/api";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";
import { getRoleHome } from "../lib/roleHome";

const CODE_LENGTH    = 6;
const RESEND_COOLDOWN = 60;

/* ── Colorful star data: [top%, left%, sizePx, color, delaySec] ── */
const STARS = [
  [4,  8, 18,"#ffd700",0.0], [6, 23, 11,"#f472b6",0.5], [3, 41, 15,"#22d3ee",1.1],
  [7, 58,  9,"#c084fc",0.2], [5, 74, 14,"#4ade80",0.8], [2, 88, 12,"#fb923c",1.6],
  [4, 96,  8,"#a78bfa",0.3],[11,  3, 10,"#ffd700",1.9],[12, 17, 16,"#f472b6",0.6],
  [10,33, 12,"#22d3ee",1.4],[14, 52,  8,"#ffffff",2.2],[13, 68, 15,"#c084fc",0.1],
  [11,83, 11,"#4ade80",1.7],[15, 94,  9,"#ffd700",0.7],[20,  7, 14,"#f472b6",2.0],
  [22,25, 10,"#22d3ee",0.4],[19, 44, 17,"#a78bfa",1.2],[21, 62, 11,"#fb923c",0.9],
  [23,79,  8,"#ffd700",2.3],[20, 92, 13,"#f472b6",0.5],[28,  2, 12,"#c084fc",1.6],
  [30,20,  9,"#22d3ee",0.2],[27, 37, 16,"#4ade80",1.0],[29, 55, 10,"#ffd700",2.1],
  [31,73, 13,"#f472b6",0.6],[28, 90,  8,"#a78bfa",1.8],[36,  5, 11,"#22d3ee",0.3],
  [38,22, 15,"#fb923c",1.4],[35, 40,  9,"#c084fc",2.4],[37, 58, 12,"#ffd700",0.7],
  [39,77,  8,"#4ade80",1.9],[36, 94, 14,"#f472b6",0.1],[44,  9, 10,"#a78bfa",1.3],
  [46,27, 17,"#22d3ee",0.8],[43, 46, 12,"#ffd700",2.0],[45, 64,  8,"#c084fc",0.4],
  [47,82, 15,"#f472b6",1.5],[44, 97, 11,"#fb923c",2.5],[52,  3,  9,"#4ade80",0.6],
  [54,19, 14,"#ffd700",1.1],[51, 36, 11,"#22d3ee",2.2],[53, 54,  8,"#f472b6",0.5],
  [55,71, 16,"#a78bfa",1.7],[52, 89, 10,"#c084fc",0.2],[60,  6, 13,"#ffd700",1.4],
  [62,23,  9,"#4ade80",2.0],[59, 41, 12,"#f472b6",0.7],[61, 60,  8,"#22d3ee",1.5],
  [64,78, 14,"#fb923c",0.3],[66, 93, 10,"#a78bfa",1.8],[70,  4, 11,"#ffd700",0.5],
  [72,20,  8,"#f472b6",2.1],[69, 38, 15,"#22d3ee",0.9],[71, 56, 12,"#c084fc",1.6],
  [73,74,  9,"#4ade80",0.4],[70, 91, 13,"#ffd700",2.3],[78,  7, 10,"#f472b6",1.0],
  [80,25, 16,"#a78bfa",0.6],[77, 43,  8,"#22d3ee",1.9],[79, 62, 11,"#fb923c",0.2],
  [81,80, 14,"#ffd700",1.4],[78, 96,  9,"#c084fc",2.0],[85,  3, 12,"#f472b6",0.7],
  [87,21,  8,"#4ade80",1.3],[84, 40, 16,"#22d3ee",0.4],[86, 60, 10,"#ffd700",2.2],
  [88,78, 13,"#a78bfa",0.8],[85, 94, 11,"#f472b6",1.7],[92,  9,  8,"#fb923c",0.3],
  [94,28, 14,"#ffd700",1.5],[91, 47, 10,"#22d3ee",2.4],[93, 66, 12,"#c084fc",0.6],
  [95,84,  9,"#4ade80",1.0],[97, 12, 11,"#f472b6",0.1],[96, 52, 15,"#ffd700",1.8],
];

/* ── 4-pointed sparkle SVG star ───────────────────────────── */
const StarSvg = ({ top, left, size, color, delay }) => (
  <svg
    aria-hidden="true"
    style={{
      position: "absolute",
      top: `${top}%`,
      left: `${left}%`,
      width: size,
      height: size,
      filter: `drop-shadow(0 0 ${Math.ceil(size * 0.45)}px ${color}cc)`,
      animation: `lpTwinkle ${2.2 + (delay % 2.1)}s ease-in-out ${delay}s infinite`,
      pointerEvents: "none",
    }}
    viewBox="0 0 24 24"
    fill={color}
  >
    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" />
  </svg>
);

/* ── Background component ─────────────────────────────────── */
const SpaceStars = () => (
  <div className="lp-stars" aria-hidden="true">
    {STARS.map(([top, left, size, color, delay], i) => (
      <StarSvg key={i} top={top} left={left} size={size} color={color} delay={delay} />
    ))}
    <div className="lp-shoot lp-shoot-1" />
    <div className="lp-shoot lp-shoot-2" />
    <div className="lp-shoot lp-shoot-3" />
  </div>
);

/* ── OTP input style (2FA) ────────────────────────────────── */
const OTP_INPUT_STYLE = (hasError, digit) => ({
  width: "50px", height: "58px", textAlign: "center",
  fontSize: "1.7rem", fontWeight: "700", borderRadius: "14px",
  border: `2px solid ${hasError ? "#f87171" : digit ? "#a78bfa" : "rgba(139,92,246,0.35)"}`,
  outline: "none", background: "rgba(255,255,255,0.12)", color: "#ffffff",
  padding: "0", boxSizing: "border-box", transition: "border-color 0.15s",
  fontFamily: "'Baloo 2', sans-serif",
});

/* ── Inline SVG icons ─────────────────────────────────────── */
const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IconLock = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconHome = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const GoogleSvg = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

/* ══════════════════════════════════════════════════════════ */
const LoginPage = () => {
  const { login, setUser } = useAuth();
  const { mergeGuestStars } = useProgress();
  const { playPop, playChime } = useSound();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep]               = useState("credentials");
  const [form, setForm]               = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [digits, setDigits]           = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading]   = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const focusInput = (index) => inputRefs.current[index]?.focus();

  /* ── Step 1: credentials ──────────────────────────────── */
  const handleCredentialSubmit = async (event) => {
    event.preventDefault();
    playPop();
    setError("");
    setLoading(true);
    try {
      const result = await login({
        identifier: form.identifier.trim(),
        username:   form.identifier.trim(),
        password:   form.password,
      });
      if (result?.requiresTwoFactor) {
        setPendingToken(result.pendingToken);
        setStep("2fa");
        setTimeout(() => focusInput(0), 100);
        return;
      }
      const loggedInUser = result;
      if (loggedInUser?.role === "child") await mergeGuestStars();
      playChime();
      navigate(getRoleHome(loggedInUser?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: 2FA ──────────────────────────────────────── */
  const handleDigitChange = (index, value) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[index] = char; setDigits(next); setError("");
    if (char && index < CODE_LENGTH - 1) focusInput(index + 1);
  };
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) focusInput(index - 1);
    if (e.key === "ArrowLeft"  && index > 0)              focusInput(index - 1);
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
    if (code.length < CODE_LENGTH) { setError(t("login.twoFa.enterAllDigits")); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/api/auth/login-verify", { pendingToken, code, deviceId: getDeviceId() });
      const loggedInUser = res.data.user;
      setUser(loggedInUser);
      sessionStorage.setItem(LOGIN_KEY, "true");
      playChime();
      navigate(getRoleHome(loggedInUser?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || t("login.twoFa.verificationFailed"));
      setDigits(Array(CODE_LENGTH).fill("")); focusInput(0);
    } finally { setLoading(false); }
  };
  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true); setError("");
    try {
      const res = await api.post("/api/auth/resend-otp", { pendingToken });
      setPendingToken(res.data.pendingToken);
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCooldown(RESEND_COOLDOWN); focusInput(0);
    } catch (err) {
      setError(err?.response?.data?.error || t("login.twoFa.resendFailed"));
    } finally { setResendLoading(false); }
  };

  /* ── 2FA render ───────────────────────────────────────── */
  if (step === "2fa") {
    return (
      <div className="lp-page">
        <SpaceStars />
        <div className="lp-card-wrap">
          <form className="lp-card" onSubmit={handle2FASubmit} style={{ gap: "14px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.8rem", lineHeight: 1, marginBottom: "6px" }}>🔐</div>
              <h2 style={{ margin: "0 0 4px", color: "#ffd700", fontFamily: "var(--font-heading)", fontSize: "1.7rem" }}>
                {t("login.twoFa.title")}
              </h2>
              <p style={{ margin: "0 0 4px", color: "#c4b5fd", fontSize: "13.5px" }}>{t("login.twoFa.subtitle")}</p>
              <p style={{ color: "rgba(196,181,253,0.6)", fontSize: "12px", margin: 0 }}>{t("login.twoFa.deviceNote")}</p>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }} onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input key={i} ref={(el) => { inputRefs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={OTP_INPUT_STYLE(!!error, digit)} aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
            {error ? <p className="lp-error">{error}</p> : null}
            <button className="lp-btn-login" type="submit" disabled={loading || digits.join("").length < CODE_LENGTH}>
              {loading ? t("login.twoFa.verifying") : `${t("login.twoFa.confirm")}`}
            </button>
            <button type="button" className="lp-btn-register" onClick={handleResend} disabled={resendCooldown > 0 || resendLoading}>
              {resendLoading ? t("login.twoFa.sending")
                : resendCooldown > 0 ? t("login.twoFa.resendCooldown", { count: resendCooldown })
                : `${t("login.twoFa.resend")}`}
            </button>
            <button type="button" className="lp-back-home"
              onClick={() => { setStep("credentials"); setError(""); setDigits(Array(CODE_LENGTH).fill("")); }}>
              {t("login.twoFa.backToLogin")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Credentials render ───────────────────────────────── */
  return (
    <div className="lp-page">
      <SpaceStars />

      <div className="lp-card-wrap">
        <form className="lp-card" onSubmit={handleCredentialSubmit}>
          {/* Header */}
          <div className="lp-card-header">
            <div className="lp-card-icon" aria-hidden="true">🚀</div>
            <h1 className="lp-title">
              <span className="lp-title-white">Log </span>
              <span className="lp-title-gold">In</span>
            </h1>
            <p className="lp-subtitle">Welcome back, little explorer! 🌟</p>
          </div>

          {/* Username */}
          <div className="lp-input-group">
            <span className="lp-input-icon"><IconUser /></span>
            <input className="lp-input" placeholder={t("login.identifier")}
              value={form.identifier} minLength={2} autoComplete="username"
              onChange={(e) => setForm((p) => ({ ...p, identifier: e.target.value }))} required />
          </div>

          {/* Password */}
          <div className="lp-input-group">
            <span className="lp-input-icon"><IconLock /></span>
            <input className="lp-input" placeholder={t("login.password")}
              type={showPassword ? "text" : "password"}
              value={form.password} minLength={4} autoComplete="current-password"
              style={{ paddingRight: "44px" }}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
            <button type="button" className="lp-pw-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>

          {/* Forgot */}
          <div className="lp-forgot">
            <Link to="/forgot-password" onClick={playPop}>{t("login.forgotPassword")}</Link>
          </div>

          {error ? <p className="lp-error">{error}</p> : null}

          {/* Login CTA */}
          <button className="lp-btn-login" type="submit" disabled={loading}>
           {loading ? t("login.loading") : t("login.submit")}
          </button>

          {/* Register */}
          <button className="lp-btn-register" type="button"
            onClick={() => { playPop(); navigate("/register"); }}>
             {t("login.needAccount")}
          </button>

          {/* Divider */}
          <div className="lp-divider"><span>or</span></div>

          {/* Google */}
          <a className="lp-btn-google" href="/auth/google" onClick={playPop}>
            <GoogleSvg />{t("login.googleSignIn")}
          </a>

          {/* Back home */}
          <Link className="lp-back-home" to="/" onClick={playPop}>
            {t("login.backHome")}
          </Link>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
