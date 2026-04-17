import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSound from "../hooks/useSound";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { playPop } = useSound();
  const userLabel = user?.email || user?.username || "Kid Explorer";

  const handleLogout = async () => {
    playPop();
    await logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-main">
        <Link className="nav-logo" to="/" onClick={playPop}>
          ⭐ Fun English
        </Link>

        <div className="nav-center-links" aria-label="Primary navigation">
          <button type="button" className="nav-link" onClick={playPop}>
            Help
          </button>
          <button type="button" className="nav-link" onClick={playPop}>
            Store
          </button>
          <Link className="nav-link nav-pill" to={user ? "/dashboard" : "/login"} onClick={playPop}>
            Join now
          </Link>
          <Link className="nav-link" to={user ? "/dashboard" : "/login"} onClick={playPop}>
            Log in
          </Link>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="chip">👤 {userLabel}</span>
              <Link className="nav-action-btn stars" to="/dashboard" onClick={playPop}>
                ⭐ Stars
              </Link>
              <button className="nav-action-btn logout" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="chip">👻 Guest</span>
              <Link className="nav-action-btn" to="/login" onClick={playPop}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      {user ? (
        <div className="navbar-status-row">
          <span className="status-pill">⭐ {user.totalStars ?? 0}</span>
          <span className="status-pill">🔥 {user.currentStreak ?? 0} Day Streak</span>
          <span className="status-pill">👤 {userLabel}</span>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
