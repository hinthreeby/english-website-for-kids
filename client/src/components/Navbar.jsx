import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSound from "../hooks/useSound";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { playPop } = useSound();
  const navigate = useNavigate();
  const userName = user?.username || "Kid Explorer";

  const handleLogout = async () => {
    playPop();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-row-1">
        <Link className="navbar-logo" to="/" onClick={playPop}>
          <span>⭐</span> Fun English
        </Link>

        <div className="navbar-links" aria-label="Primary navigation">
          <button type="button" className="nav-link" onClick={playPop}>
            Help
          </button>
          <button type="button" className="nav-link" onClick={playPop}>
            Store
          </button>
          {!user ? (
            <>
              <Link className="nav-link join-now" to="/register" onClick={playPop}>
                Register Now
              </Link>
              <Link className="nav-link" to="/login" onClick={playPop}>
                Log in
              </Link>
            </>
          ) : (
            <button type="button" className="nav-link" onClick={handleLogout}>
              Log out
            </button>
          )}
        </div>

        <div className="navbar-auth">
          <span className="nav-email-badge">{user ? `Hello, ${userName}` : "👻 Guest"}</span>
          {user ? (
            <Link className="btn-stars" to="/dashboard" onClick={playPop}>
              ⭐ Stars
            </Link>
          ) : null}
        </div>
      </div>

      {user ? (
        <div className="navbar-row-2">
          <span className="badge-stars">⭐ {user.totalStars ?? 0}</span>
          <span className="badge-streak">🔥 {user.currentStreak ?? 0} Day Streak</span>
          <span className="badge-email">👤 {userName}</span>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
