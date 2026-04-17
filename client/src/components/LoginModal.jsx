import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const LoginModal = ({ onSuccess, onClose, initialMode = "login" }) => {
  const { login, register } = useAuth();
  const { mergeGuestStars } = useProgress();
  const { playPop, playChime } = useSound();
  const [mode, setMode] = useState(initialMode === "register" ? "register" : "login");
  const [form, setForm] = useState({
    identifier: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    playPop();
    setError("");

    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await login({ identifier: form.identifier.trim(), password: form.password });
      } else {
        await register({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
      }
      const mergedStars = await mergeGuestStars();
      playChime();
      onSuccess?.(mergedStars);
    } catch (err) {
      setError(err?.response?.data?.message || "Oops! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="login-modal" onSubmit={onSubmit}>
        <h2>{mode === "login" ? "Login" : "Sign Up"}</h2>
        {mode === "login" ? (
          <input
            className="kid-input"
            placeholder="Email or Username"
            value={form.identifier}
            minLength={2}
            onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
            required
          />
        ) : (
          <>
            <input
              className="kid-input"
              placeholder="Username"
              value={form.username}
              minLength={2}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            <input
              className="kid-input"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </>
        )}
        <input
          className="kid-input"
          placeholder="Password"
          type="password"
          value={form.password}
          minLength={4}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />

        {mode === "register" ? (
          <input
            className="kid-input"
            placeholder="Confirm Password"
            type="password"
            value={form.confirmPassword}
            minLength={4}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
        ) : null}

        {error && <p className="error-text">{error}</p>}
        <button className="kid-btn" disabled={loading} type="submit">
          {loading ? "..." : mode === "login" ? "🔐 Login" : "✨ Register"}
        </button>
        <button
          className="kid-btn secondary"
          type="button"
          onClick={() => {
            playPop();
            setError("");
            setMode((prev) => (prev === "login" ? "register" : "login"));
          }}
        >
          {mode === "login" ? "Need an account?" : "Have an account?"}
        </button>
        {onClose && (
          <button
            className="kid-btn ghost"
            type="button"
            onClick={() => {
              playPop();
              onClose();
            }}
          >
            ✖ Close
          </button>
        )}
      </form>
    </div>
  );
};

export default LoginModal;
