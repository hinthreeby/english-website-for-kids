import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRoleHome } from "../lib/roleHome";

const OAuthCallbackPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      navigate(getRoleHome(user.role), { replace: true });
    } else {
      navigate("/login?error=google_failed", { replace: true });
    }
  }, [isLoading, user, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "1rem",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "4px solid #e2e8f0",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#64748b", fontSize: "1rem" }}>Log in...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default OAuthCallbackPage;
