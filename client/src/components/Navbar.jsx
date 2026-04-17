import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSound from "../hooks/useSound";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { playPop } = useSound();

  const handleLogout = async () => {
    playPop();
    await logout();
  };

  return (
    <nav className="navbar">
      <Link className="nav-logo" to="/" onClick={playPop}>
        🌟 Fun English
      </Link>
      <div className="nav-actions">
        {user ? <span className="chip">👧 {user.username}</span> : <span className="chip">👻 Guest</span>}
        <Link className="kid-btn small" to="/dashboard" onClick={playPop}>
          🏆 Stars
        </Link>
        {user ? (
          <button className="kid-btn small" type="button" onClick={handleLogout}>
            🚪 Logout
          </button>
        ) : (
          <Link className="kid-btn small" to="/login" onClick={playPop}>
            🔐 Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
