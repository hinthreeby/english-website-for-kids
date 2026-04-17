import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";

const LoginModal = ({ onSuccess, onClose }) => {
  const { login, register } = useAuth();
  const { mergeGuestStars } = useProgress();
  const { playPop, playChime } = useSound();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    playPop();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(form);
      } else {
        await register(form);
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
          placeholder="Password"
          type="password"
          value={form.password}
          minLength={4}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button className="kid-btn" disabled={loading} type="submit">
          {loading ? "..." : mode === "login" ? "🔐 Login" : "✨ Create Account"}
        </button>
        <button
          className="kid-btn secondary"
          type="button"
          onClick={() => {
            playPop();
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
