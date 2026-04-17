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
          <Link className="nav-link join-now" to={user ? "/dashboard" : "/login"} onClick={playPop}>
            Join now
          </Link>
          <Link className="nav-link" to={user ? "/dashboard" : "/login"} onClick={playPop}>
            Log in
          </Link>
        </div>

        <div className="navbar-auth">
          {user ? (
            <>
              <span className="nav-email-badge">{userLabel}</span>
              <Link className="btn-stars" to="/dashboard" onClick={playPop}>
                ⭐ Stars
              </Link>
              <button className="btn-logout" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="nav-email-badge">👻 Guest</span>
              <Link className="btn-logout" to="/login" onClick={playPop}>
                Log in
              </Link>
            </>
          )}
        </div>
      </div>

      {user ? (
        <div className="navbar-row-2">
          <span className="badge-stars">⭐ {user.totalStars ?? 0}</span>
          <span className="badge-streak">🔥 {user.currentStreak ?? 0} Day Streak</span>
          <span className="badge-email">👤 {userLabel}</span>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
