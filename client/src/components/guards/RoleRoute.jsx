import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRoleHome } from "../../lib/roleHome";

export const RoleRoute = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
};

export const ChildOnly = ({ children }) => (
  <RoleRoute allowedRoles={["child"]}>{children}</RoleRoute>
);

export const ParentOnly = ({ children }) => (
  <RoleRoute allowedRoles={["parent", "admin"]}>{children}</RoleRoute>
);

export const TeacherOnly = ({ children }) => (
  <RoleRoute allowedRoles={["teacher", "admin"]}>{children}</RoleRoute>
);

export const AdminOnly = ({ children }) => (
  <RoleRoute allowedRoles={["admin"]}>{children}</RoleRoute>
);
