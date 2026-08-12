/**
 * Custom Hook pour le minuteur d'inactivité et l'expiration absolue de session.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  INACTIVITY_TIMEOUT_MS,
  WARNING_THRESHOLD_MS,
  ABSOLUTE_SESSION_MS,
  CHECK_INTERVAL_MS,
  ACTIVITY_THROTTLE_MS,
} from "@/constants/session";

interface UseInactivityTimerProps {
  isAuthenticated: boolean;
  onInactivityExpire: () => void;
  onAbsoluteExpire: () => void;
}

export function useInactivityTimer({
  isAuthenticated,
  onInactivityExpire,
  onAbsoluteExpire,
}: UseInactivityTimerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const lastActivityRef = useRef<number>(Date.now());

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > ACTIVITY_THROTTLE_MS) {
      lastActivityRef.current = now;
      if (typeof window !== "undefined") {
        localStorage.setItem("transcribo_last_activity", now.toString());
      }
      if (showWarning) {
        setShowWarning(false);
      }
    }
  }, [showWarning]);

  // Écouteurs d'événements utilisateur
  useEffect(() => {
    if (!isAuthenticated) return;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("transcribo_last_activity");
      if (!stored) {
        localStorage.setItem("transcribo_last_activity", Date.now().toString());
      } else {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          lastActivityRef.current = parsed;
        }
      }
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    const onEvent = () => recordActivity();

    events.forEach((ev) => window.addEventListener(ev, onEvent, { passive: true }));

    const onStorage = (e: StorageEvent) => {
      if (e.key === "transcribo_last_activity" && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed) && parsed > 0) {
          lastActivityRef.current = parsed;
          setShowWarning(false);
        }
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onEvent));
      window.removeEventListener("storage", onStorage);
    };
  }, [isAuthenticated, recordActivity]);

  // Intervalle de vérification
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      if (typeof window === "undefined") return;
      const now = Date.now();

      // 1. Limite absolue 7 jours
      const sessionCreatedStr = localStorage.getItem("transcribo_session_created_at");
      if (sessionCreatedStr) {
        let sessionCreatedAt = parseInt(sessionCreatedStr, 10);
        if (!isNaN(sessionCreatedAt) && sessionCreatedAt > 0) {
          // Si stocké en secondes (format timestamp UNIX 10 chiffres), convertir en ms
          if (sessionCreatedAt < 10000000000) {
            sessionCreatedAt *= 1000;
          }
          if (now - sessionCreatedAt >= ABSOLUTE_SESSION_MS) {
            clearInterval(interval);
            onAbsoluteExpire();
            return;
          }
        }
      }

      // 2. Inactivité 30 min
      const lastActivityStr = localStorage.getItem("transcribo_last_activity");
      let lastActivity = lastRecordedTimestamp(lastActivityStr, lastActivityRef.current);

      const elapsed = now - lastActivity;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(interval);
        setShowWarning(false);
        onInactivityExpire();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        const timeLeftMs = INACTIVITY_TIMEOUT_MS - elapsed;
        setRemainingSeconds(Math.max(0, Math.ceil(timeLeftMs / 1000)));
        setShowWarning(true);
      } else {
        if (showWarning) setShowWarning(false);
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, onInactivityExpire, onAbsoluteExpire, showWarning]);

  const resetTimer = useCallback(() => {
    recordActivity();
    setShowWarning(false);
  }, [recordActivity]);

  return {
    showWarning,
    remainingSeconds,
    resetTimer,
  };
}

function lastRecordedTimestamp(stored: string | null, fallback: number): number {
  if (!stored) return fallback;
  let val = parseInt(stored, 10);
  if (isNaN(val) || val <= 0) return fallback;
  if (val < 10000000000) val *= 1000;
  return val;
}
