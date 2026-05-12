"use client";

import React, {
  createContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { Alert } from "./Alert";

export type GlobalAlert = {
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number; // ms
};

export interface AlertContextType {
  showAlert: (alert: GlobalAlert) => void;
  closeAlert: () => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(
  undefined,
);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<GlobalAlert | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(0);

  // Show alert and start timer
  const showAlert = (a: GlobalAlert) => {
    setAlert(a);
    setProgress(0);
    // Trigger slide-in animation
    setTimeout(() => setIsVisible(true), 10);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (a.duration) {
      const start = Date.now();
      const duration = a.duration;
      function tick() {
        const elapsed = Date.now() - start;
        const pct = Math.min(100, (elapsed / duration) * 100);
        setProgress(pct);
        if (pct < 100) {
          timerRef.current = setTimeout(tick, 50);
        } else {
          // Slide out before removing
          setIsVisible(false);
          setTimeout(() => setAlert(null), 400); // Match transition duration
        }
      }
      tick();
    }
  };

  // Close alert manually
  const closeAlert = () => {
    setIsVisible(false);
    setTimeout(() => {
      setAlert(null);
      setProgress(0);
    }, 400); // Match transition duration
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Load alert on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = sessionStorage.getItem("careconnect-alert");
      if (stored) {
        setAlert(JSON.parse(stored) as GlobalAlert);
      }
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Persist alert in sessionStorage
  useEffect(() => {
    if (!isLoaded) return;

    if (alert) {
      sessionStorage.setItem("careconnect-alert", JSON.stringify(alert));
    } else {
      sessionStorage.removeItem("careconnect-alert");
    }
  }, [alert, isLoaded]);

  // Restore alert on mount
  // No effect needed for alert visibility or progress
  useEffect(() => {
    if (alert) {
      // Trigger slide-in animation on mount if alert exists
      setTimeout(() => setIsVisible(true), 10);
    }
  }, [alert]);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      {alert && (
        <div
          style={{
            position: "fixed",
            top: "6rem",
            right: "2rem",
            zIndex: 9999,
            maxWidth: "350px",
            transition:
              "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease",
            transform: isVisible ? "translateX(0)" : "translateX(120%)",
            opacity: isVisible ? 1 : 0,
          }}
        >
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={closeAlert}
          />
          <div
            style={{
              height: "4px",
              width: "100%",
              background: "var(--border-muted)",
              borderRadius: "2px",
              overflow: "hidden",
              marginTop: "-12px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--primary)",
                transition: "width 0.1s linear",
              }}
            />
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
