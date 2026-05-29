import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import earthImg from "../assets/general/planet/earth.png";
import jupiterImg from "../assets/general/planet/jupiter.png";
import planetImg from "../assets/general/planet/planet.png";
import starImg from "../assets/general/star/star.png";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
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

const RegisterPage = () => {
  const { setUser } = useAuth();
  const { playPop, playChime } = useSound();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // "form" | "verify"
  const [form, setForm] = useState({
    role: "parent",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [pendingToken, setPendingToken] = useState("");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
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

  // ── Step 1: submit registration form ───────────────────────────────────────

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    playPop();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(t("register.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/register-init", {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });
      setPendingToken(res.data.pendingToken);
      setStep("verify");
      setTimeout(() => focusInput(0), 100);
    } catch (err) {
      setError(err?.response?.data?.error || t("register.error"));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP verification ────────────────────────────────────────────────

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

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError(t("register.verify.enterAllDigits"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/register-verify", { pendingToken, code });
      setUser(res.data.user);
      playChime();
      navigate(getRoleHome(res.data.user.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || t("register.verify.failed"));
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
      setError(err?.response?.data?.error || t("register.verify.resendFailed"));
    } finally {
      setResendLoading(false);
    }
  };

  // ── Render: OTP step ────────────────────────────────────────────────────────

  if (step === "verify") {
    return (
      <div className="auth-page">
        <SpaceDecorations />
        <form className="auth-card" onSubmit={handleVerifySubmit} style={{ gap: "1rem" }}>
          <h2>{t("register.verify.title")}</h2>
          <p className="subtitle" style={{ marginBottom: "0.25rem" }}>
            {t("register.verify.subtitle")} <strong>{form.email}</strong>.
          </p>
          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
            {t("register.verify.expires")}
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
            {loading ? t("register.verify.verifying") : t("register.verify.verifyAccount")}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            style={{ fontSize: "0.9rem" }}
          >
            {resendLoading
              ? t("register.verify.sending")
              : resendCooldown > 0
              ? t("register.verify.resendCooldown", { count: resendCooldown })
              : t("register.verify.resendCode")}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setStep("form"); setError(""); setDigits(Array(CODE_LENGTH).fill("")); }}
            style={{ fontSize: "0.85rem", opacity: 0.7 }}
          >
            {t("register.verify.backToForm")}
          </button>
        </form>
      </div>
    );
  }

  // ── Render: registration form ───────────────────────────────────────────────

  const isTeacher = form.role === "teacher";

  return (
    <div className="auth-page">
      <SpaceDecorations />

      <form className="auth-card auth-card-register" onSubmit={handleFormSubmit}>
        <h2>{t("register.title")}</h2>
        <p className="subtitle">{t("register.subtitle")}</p>

        <div className="register-role-grid" role="radiogroup" aria-label="Choose role">
          {[
            { id: "parent", emoji: "👨‍👩‍👧", label: t("register.roleParent") },
            { id: "teacher", emoji: "👩‍🏫", label: t("register.roleTeacher") },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={`register-role-pill ${form.role === option.id ? "active" : ""}`}
              onClick={() => setForm((prev) => ({ ...prev, role: option.id }))}
            >
              <span>{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>

        {isTeacher ? (
          <div className="notice-box">{t("register.teacherNotice")}</div>
        ) : null}

        <div className="register-fields-grid">
          <div className="register-question-group">
            <label>{t("register.username")}</label>
            <input
              placeholder={t("register.usernamePlaceholder")}
              value={form.username}
              minLength={2}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>

          <div className="register-question-group">
            <label>{t("register.email")}</label>
            <input
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="register-question-group">
            <label>{t("register.password")}</label>
            <input
              placeholder={t("register.passwordPlaceholder")}
              type="password"
              minLength={4}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="register-question-group">
            <label>{t("register.confirmPassword")}</label>
            <input
              placeholder={t("register.confirmPasswordPlaceholder")}
              type="password"
              minLength={4}
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>
        </div>

        {error ? <p className="error-text auth-error">{error}</p> : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? t("register.sendingCode") : t("register.continue")}
        </button>

        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playPop();
            navigate("/login");
          }}
        >
          {t("register.haveAccount")}
        </button>

        <Link className="auth-back-link" to="/" onClick={playPop}>
          {t("register.backHome")}
        </Link>
      </form>
    </div>
  );
};

export default RegisterPage;
