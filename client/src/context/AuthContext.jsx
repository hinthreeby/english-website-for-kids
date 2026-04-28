/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);
const LOGIN_KEY = "mascot_just_logged_in";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (payload) => {
    const response = await api.post("/auth/register", payload);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const login = useCallback(async (arg1, arg2) => {
    const payload =
      typeof arg1 === "object" && arg1 !== null
        ? arg1
        : { username: arg1, password: arg2, identifier: arg1 };
    const response = await api.post("/auth/login", payload);
    setUser(response.data.user);
    sessionStorage.setItem(LOGIN_KEY, "true");
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Client-side logout should still succeed even if server logout fails.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      sessionStorage.clear();
      setUser(null);
    }
  }, []);

  const isChild = user?.role === "child";
  const isParent = user?.role === "parent";
  const isTeacher = user?.role === "teacher";
  const isAdmin = user?.role === "admin";
  const hasRole = useCallback((...roles) => roles.includes(user?.role), [user?.role]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      loading: isLoading,
      refreshUser,
      register,
      login,
      logout,
      isChild,
      isParent,
      isTeacher,
      isAdmin,
      hasRole,
    }),
    [hasRole, isAdmin, isChild, isLoading, isParent, isTeacher, login, logout, refreshUser, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
