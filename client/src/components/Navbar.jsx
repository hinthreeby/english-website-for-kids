import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSound from "../hooks/useSound";
import { getRoleHome } from "../lib/roleHome";

const Navbar = () => {
  const { user, logout, isChild, isParent, isTeacher, isAdmin } = useAuth();
  const { playPop } = useSound();
  const navigate = useNavigate();
  const userName = user?.displayName || user?.username || "Kid Explorer";

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
          {isChild ? (
            <>
              <Link className="nav-link" to="/collection" onClick={playPop}>
                Collection
              </Link>
              <Link className="nav-link" to="/shop" onClick={playPop}>
                Store
              </Link>
              <Link className="nav-link" to="/my-home" onClick={playPop}>
                My Home
              </Link>
            </>
          ) : null}

          {isParent ? (
            <>
              <Link className="nav-link" to="/parent/dashboard" onClick={playPop}>
                Dashboard
              </Link>
              <Link className="nav-link" to="/parent/children" onClick={playPop}>
                My Children
              </Link>
              <Link className="nav-link" to="/parent/profile" onClick={playPop}>
                Profile
              </Link>
            </>
          ) : null}

          {isTeacher ? (
            <>
              <Link className="nav-link" to="/teacher/dashboard" onClick={playPop}>
                Dashboard
              </Link>
              <Link className="nav-link" to="/teacher/wordlist" onClick={playPop}>
                Word Lists
              </Link>
              <Link className="nav-link" to="/teacher/profile" onClick={playPop}>
                Profile
              </Link>
            </>
          ) : null}

          {isAdmin ? (
            <>
              <Link className="nav-link" to="/admin/dashboard" onClick={playPop}>
                Dashboard
              </Link>
              <Link className="nav-link" to="/admin/users" onClick={playPop}>
                Users
              </Link>
              <Link className="nav-link" to="/admin/approvals" onClick={playPop}>
                Approvals
              </Link>
              <Link className="nav-link" to="/admin/profile" onClick={playPop}>
                Profile
              </Link>
            </>
          ) : null}

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
          {user ? (
            <span className={`role-badge role-${user.role}`}>
              {user.role === "child" ? "👶" : null}
              {user.role === "parent" ? "👨‍👩‍👧" : null}
              {user.role === "teacher" ? "👩‍🏫" : null}
              {user.role === "admin" ? "🛡️" : null}
              {userName}
            </span>
          ) : (
            <span className="nav-email-badge">Guest</span>
          )}
          {user ? (
            <>
              {isChild ? <span className="nav-stars">⭐ {user.totalStars || 0}</span> : null}
              <Link className="btn-stars" to={getRoleHome(user.role)} onClick={playPop}>
                Home
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
