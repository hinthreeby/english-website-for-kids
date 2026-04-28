export const ROLE_HOME = {
  child: "/",
  parent: "/parent/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
};

export const getRoleHome = (role) => ROLE_HOME[role] || "/";
