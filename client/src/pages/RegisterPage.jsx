import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import earthImg from "../assets/earth.png";
import jupiterImg from "../assets/jupiter.png";
import planetImg from "../assets/planet.png";
import starImg from "../assets/star.png";
import { useAuth } from "../context/AuthContext";
import useProgress from "../hooks/useProgress";
import useSound from "../hooks/useSound";
import { getRoleHome } from "../lib/roleHome";

const STAR_COUNT = 20;

const RegisterPage = () => {
  const { register } = useAuth();
  const { mergeGuestStars } = useProgress();
  const { playPop, playChime } = useSound();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "child",
    username: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    parentCode: "",
    childNickname: "",
    teacherGrade: "",
    learningGoal: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    playPop();
    setError("");
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const createdUser = await register({
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        parentCode: form.role === "child" ? form.parentCode.trim() : "",
      });
      if (createdUser?.role === "child") {
        await mergeGuestStars();
      }
      playChime();
      navigate(getRoleHome(createdUser?.role || form.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const isChild = form.role === "child";
  const isParent = form.role === "parent";
  const isTeacher = form.role === "teacher";

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

      <form className="auth-card auth-card-register" onSubmit={handleRegister}>
        <h2>✨ Sign Up</h2>
        <p className="subtitle">Trả lời vài câu hỏi để tạo tài khoản phù hợp.</p>

        <div className="register-role-grid" role="radiogroup" aria-label="Choose role">
          {[
            { id: "child", emoji: "👶", label: "Child" },
            { id: "parent", emoji: "👨‍👩‍👧", label: "Parent" },
            { id: "teacher", emoji: "👩‍🏫", label: "Teacher" },
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
          <div className="notice-box">Teacher accounts require admin approval before login.</div>
        ) : null}

        <div className="register-question-group">
          <label>Username</label>
          <input
            placeholder="Choose your username"
            value={form.username}
            minLength={2}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
        </div>

        <div className="register-question-group">
          <label>Display Name</label>
          <input
            placeholder="How should we call you?"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
          />
        </div>

        <div className="register-question-group">
          <label>Email (optional)</label>
          <input
            placeholder="you@example.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="register-question-group">
          <label>Password</label>
          <input
            placeholder="Create password"
            type="password"
            minLength={4}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>

        <div className="register-question-group">
          <label>Confirm Password</label>
          <input
            placeholder="Repeat password"
            type="password"
            minLength={4}
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
        </div>

        {isChild ? (
          <>
            <div className="register-question-group">
              <label>Child Nickname</label>
              <input
                placeholder="Ex: Moon Explorer"
                value={form.childNickname}
                onChange={(e) => setForm((prev) => ({ ...prev, childNickname: e.target.value }))}
              />
            </div>
            <div className="register-question-group">
              <label>Parent Code (optional)</label>
              <input
                placeholder="Paste parent account ID"
                value={form.parentCode}
                onChange={(e) => setForm((prev) => ({ ...prev, parentCode: e.target.value }))}
              />
            </div>
          </>
        ) : null}

        {isParent ? (
          <div className="register-question-group">
            <label>Learning Goal For Your Child</label>
            <input
              placeholder="Ex: Daily speaking practice"
              value={form.learningGoal}
              onChange={(e) => setForm((prev) => ({ ...prev, learningGoal: e.target.value }))}
            />
          </div>
        ) : null}

        {isTeacher ? (
          <div className="register-question-group">
            <label>Which grade do you teach?</label>
            <input
              placeholder="Ex: Grade 2"
              value={form.teacherGrade}
              onChange={(e) => setForm((prev) => ({ ...prev, teacherGrade: e.target.value }))}
            />
          </div>
        ) : null}

        {error ? <p className="error-text auth-error">{error}</p> : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "🚀 Create Account"}
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
