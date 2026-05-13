import { useCallback } from "react";
import api from "../lib/api";

const GUEST_STARS_KEY = "funenglish_guest_stars";

const useProgress = () => {
  const addGuestStars = useCallback((stars) => {
    const current = Number(localStorage.getItem(GUEST_STARS_KEY) || 0);
    localStorage.setItem(GUEST_STARS_KEY, String(current + stars));
  }, []);

  const getGuestStars = useCallback(() => {
    return Number(localStorage.getItem(GUEST_STARS_KEY) || 0);
  }, []);

  const clearGuestStars = useCallback(() => {
    localStorage.removeItem(GUEST_STARS_KEY);
  }, []);

  const saveProgress = useCallback(async (gameId, starsEarned) => {
    const response = await api.post("/api/progress/save", { gameId, starsEarned });
    return response.data;
  }, []);

  const fetchMyProgress = useCallback(async () => {
    const response = await api.get("/api/progress/me");
    return response.data;
  }, []);

  const mergeGuestStars = useCallback(async () => {
    const total = getGuestStars();
    if (!total) {
      return 0;
    }

    let remaining = total;
    while (remaining > 0) {
      const chunk = Math.min(3, remaining);
      await saveProgress("guest-merge", chunk);
      remaining -= chunk;
    }

    clearGuestStars();
    return total;
  }, [clearGuestStars, getGuestStars, saveProgress]);

  return {
    addGuestStars,
    getGuestStars,
    clearGuestStars,
    saveProgress,
    fetchMyProgress,
    mergeGuestStars,
  };
};

export default useProgress;
