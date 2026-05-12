import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import earthImg from "../assets/general/planet/earth.png";
import jupiterImg from "../assets/general/planet/jupiter.png";
import planetImg from "../assets/general/planet/planet.png";
import starImg from "../assets/general/star/star.png";
import { getRoleHome } from "../lib/roleHome";

const STAR_COUNT = 20;
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const OAuthVerifyPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      setError("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingToken, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Xác thực thất bại.");
        setDigits(Array(CODE_LENGTH).fill(""));
        focusInput(0);
        return;
      }

      navigate(getRoleHome(data.user.role), { replace: true });
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");

    try {
      const res = await fetch("/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gửi lại thất bại.");
        return;
      }

      setPendingToken(data.pendingToken);
      setDigits(Array(CODE_LENGTH).fill(""));
      setResendCooldown(RESEND_COOLDOWN);
      focusInput(0);
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
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

      <form className="auth-card" onSubmit={handleSubmit} style={{ gap: "1rem" }}>
        <h2>📧 Xác thực 2 bước</h2>
        <p className="subtitle" style={{ marginBottom: "0.25rem" }}>
          Mã xác thực đã được gửi đến email của bạn.
        </p>
        <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
          Mã có hiệu lực trong 5 phút.
        </p>

        {/* 6-digit OTP inputs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            margin: "0.5rem 0",
          }}
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
                width: "46px",
                height: "56px",
                textAlign: "center",
                fontSize: "1.6rem",
                fontWeight: "700",
                borderRadius: "10px",
                border: `2px solid ${error ? "#f87171" : digit ? "#6366f1" : "#cbd5e1"}`,
                outline: "none",
                background: "#fff",
                color: "#1e293b",
                transition: "border-color 0.15s",
              }}
              aria-label={`Chữ số ${i + 1}`}
            />
          ))}
        </div>

        {error ? <p className="error-text auth-error">{error}</p> : null}

        <button
          className="btn-primary"
          type="submit"
          disabled={loading || digits.join("").length < CODE_LENGTH}
        >
          {loading ? "Đang xác thực..." : "✅ Xác nhận"}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          style={{ fontSize: "0.9rem" }}
        >
          {resendLoading
            ? "Đang gửi..."
            : resendCooldown > 0
            ? `Gửi lại mã (${resendCooldown}s)`
            : "🔄 Gửi lại mã"}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/login")}
          style={{ fontSize: "0.85rem", opacity: 0.7 }}
        >
          ← Quay lại đăng nhập
        </button>
      </form>
    </div>
  );
};

export default OAuthVerifyPage;
