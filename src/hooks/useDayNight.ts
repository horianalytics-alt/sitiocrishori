import { useCallback, useEffect, useState } from "react";

export type DayNightMode = "dia" | "noite";
const STORAGE_KEY = "site-day-night-mode";

export function useDayNight() {
  const [mode, setMode] = useState<DayNightMode>("dia");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dia" || saved === "noite") {
      setMode(saved);
    } else {
      const hour = new Date().getHours();
      setMode(hour >= 18 || hour < 6 ? "noite" : "dia");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, hydrated]);

  const toggle = useCallback(() => {
    setMode((m) => (m === "dia" ? "noite" : "dia"));
  }, []);

  return { mode, setMode, toggle, hydrated };
}
