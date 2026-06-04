import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import earthImg from "../assets/general/planet/earth.png";
import jupiterImg from "../assets/general/planet/jupiter.png";
import planetImg from "../assets/general/planet/planet.png";
import starImg from "../assets/general/star/star.png";
import { getRoleHome } from "../lib/roleHome";
import { useAuth, LOGIN_KEY } from "../context/AuthContext";

const STAR_COUNT = 20;
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const OAuthVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { setUser } = useAuth();

  const [pendingToken, setPendingToken] = useState(searchParams.get("token") || "");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no token in URL
  useEffect(() => {
    if (!searchParams.get("token")) {
      navigate("/login?error=missing_token", { replace: true });
    }
  }, [searchParams, navigate]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const focusInput = (index) => inputRefs.current[index]?.focus();

  const handleDigitChange = (index, value) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");
    if (char && index < CODE_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError(t("oauthVerify.enterAllDigits"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingToken, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("oauthVerify.verificationFailed"));
        setDigits(Array(CODE_LENGTH).fill(""));
        focusInput(0);
        return;
      }

      setUser(data.user);
      sessionStorage.setItem(LOGIN_KEY, "true");
      navigate(getRoleHome(data.user.role), { replace: true });
    } catch {
      setError(t("oauthVerify.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("oauthVerify.connectionError"));
        return;
      }

      setPendingToken(data.pendingToken);
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCooldown(RESEND_COOLDOWN);
      focusInput(0);
    } catch {
      setError(t("oauthVerify.connectionError"));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
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

      <form
        className="auth-card"
        onSubmit={handleSubmit}
        style={{ gap: "1.25rem", padding: "2.5rem 2rem", textAlign: "center" }}
      >
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%", margin: "0 auto",
          background: "linear-gradient(135deg, rgba(123,47,247,0.35), rgba(255,107,157,0.25))",
          border: "1.5px solid rgba(167,139,250,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.8rem",
          boxShadow: "0 0 24px rgba(123,47,247,0.4)",
        }}>
          🔐
        </div>

        <h2 style={{ margin: 0 }}>{t("oauthVerify.title")}</h2>

        <p className="subtitle" style={{ margin: 0, color: "#c4b5fd" }}>
          {t("oauthVerify.subtitle")}
        </p>
        <p style={{ color: "rgba(167,139,250,0.6)", fontSize: "0.82rem", margin: 0 }}>
          {t("oauthVerify.expires")}
        </p>

        {/* 6-digit OTP inputs */}
        <div
          style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "0.5rem 0" }}
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
              style={{
                width: "48px",
                height: "56px",
                textAlign: "center",
                fontSize: "1.5rem",
                fontWeight: "700",
                borderRadius: "12px",
                border: `2px solid ${error ? "rgba(248,113,113,0.8)" : digit ? "rgba(139,92,246,0.9)" : "rgba(167,139,250,0.3)"}`,
                outline: "none",
                background: digit ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.05)",
                color: "#f0e6ff",
                padding: "0",
                boxSizing: "border-box",
                transition: "border-color 0.15s, background 0.15s",
                flex: "0 0 auto",
                boxShadow: digit ? "0 0 10px rgba(139,92,246,0.3)" : "none",
              }}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {error && (
          <p className="error-text auth-error" style={{ margin: 0 }}>{error}</p>
        )}

        {/* Confirm button */}
        <button
          className="btn-primary"
          type="submit"
          disabled={loading || digits.join("").length < CODE_LENGTH}
          style={{ marginTop: "0.25rem" }}
        >
          {loading ? t("oauthVerify.verifying") : t("oauthVerify.confirm")}
        </button>

        {/* Resend button — glass style */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          style={{
            width: "100%",
            background: "rgba(123,47,247,0.12)",
            border: "1px solid rgba(167,139,250,0.35)",
            borderRadius: "14px",
            padding: "11px 12px",
            color: resendCooldown > 0 ? "rgba(167,139,250,0.5)" : "#c4b5fd",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: resendCooldown > 0 || resendLoading ? "not-allowed" : "pointer",
            transition: "background 0.15s, color 0.15s",
            fontFamily: "inherit",
          }}
        >
          {resendLoading
            ? t("oauthVerify.sending")
            : resendCooldown > 0
            ? t("oauthVerify.resendCooldown", { count: resendCooldown })
            : t("oauthVerify.resend")}
        </button>

        {/* Back to Login — subtle link style */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "rgba(167,139,250,0.6)",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "4px 0",
            transition: "color 0.15s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#c4b5fd"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(167,139,250,0.6)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t("oauthVerify.backToLogin")}
        </button>
      </form>
    </div>
  );
};

export default OAuthVerifyPage;
