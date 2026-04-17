import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import earthImg from "../assets/earth.png";
import jupiterImg from "../assets/jupiter.png";
import planetImg from "../assets/planet.png";
import starImg from "../assets/star.png";
import { useAuth } from "../context/AuthContext";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const STAR_COUNT = 20;

const RegisterPage = () => {
  const { register } = useAuth();
  const { mergeGuestStars } = useProgress();
  const { playPop, playChime } = useSound();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    playPop();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      await mergeGuestStars();
      playChime();
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
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
        <h2>✨ Sign Up</h2>
        <p className="subtitle">Create your space learning account.</p>

        <input
          placeholder="Username"
          value={form.username}
          minLength={2}
          onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
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
        <input
          placeholder="Confirm Password"
          type="password"
          value={form.confirmPassword}
          minLength={4}
          onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          required
        />

        {error ? <p className="error-text auth-error">{error}</p> : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Loading..." : "✨ Register"}
        </button>

        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            playPop();
            navigate("/login");
          }}
        >
          🔐 Already have an account?
        </button>

        <Link className="auth-back-link" to="/" onClick={playPop}>
          ← Back to Home
        </Link>
      </form>
    </div>
  );
};

export default RegisterPage;
