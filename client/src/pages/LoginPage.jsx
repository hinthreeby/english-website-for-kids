import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import earthImg from "../assets/general/planet/earth.png";
import jupiterImg from "../assets/general/planet/jupiter.png";
import planetImg from "../assets/general/planet/planet.png";
import starImg from "../assets/general/star/star.png";
import { useAuth } from "../context/AuthContext";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";
import { getRoleHome } from "../lib/roleHome";

const STAR_COUNT = 20;

const LoginPage = () => {
  const { login } = useAuth();
  const { mergeGuestStars } = useProgress();
  const { playPop, playChime } = useSound();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    playPop();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login({
        identifier: form.identifier.trim(),
        username: form.identifier.trim(),
        password: form.password,
      });
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

      <form className="auth-card" onSubmit={handleSubmit}>
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

        <Link className="auth-back-link" to="/" onClick={playPop}>
          ← Back to Home
        </Link>
      </form>
    </div>
  );
};

export default LoginPage;
