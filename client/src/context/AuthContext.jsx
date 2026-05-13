/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export const LOGIN_KEY = "mascot_just_logged_in";

export function getDeviceId() {
  let id = localStorage.getItem("funeng_device_id");
  if (!id) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("funeng_device_id", id);
  }
  return id;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/api/auth/me");
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

  // Legacy register (calls old endpoint that creates account immediately)
  const register = useCallback(async (payload) => {
    const response = await api.post("/api/auth/register", payload);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  /**
   * Login with email/username + password.
   * Returns the user object on success, or { requiresTwoFactor: true, pendingToken } if 2FA is needed.
   */
  const login = useCallback(async (arg1, arg2) => {
    const payload =
      typeof arg1 === "object" && arg1 !== null
        ? arg1
        : { username: arg1, password: arg2, identifier: arg1 };

    payload.deviceId = getDeviceId();

    const response = await api.post("/api/auth/login", payload);

    if (response.data.requiresTwoFactor) {
      return { requiresTwoFactor: true, pendingToken: response.data.pendingToken };
    }

    setUser(response.data.user);
    sessionStorage.setItem(LOGIN_KEY, "true");
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
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
