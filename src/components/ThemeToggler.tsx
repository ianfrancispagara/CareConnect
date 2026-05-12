"use client";

import "@theme-toggles/react/css/Within.css";
import { Within } from "@theme-toggles/react";
import { useState, useEffect } from "react";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";

  const stored = localStorage.getItem("theme") as "dark" | "light";
  if (stored) return stored;

  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function ThemeToggler() {
  const [isDark, setIsDark] = useState(true);

  // Apply theme to DOM on mount and when theme changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check localStorage on mount
      const savedTheme = getInitialTheme();
      setIsDark(savedTheme === "dark");
      document.documentElement.setAttribute("data-theme", savedTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div
      className="theme-toggler"
      style={{
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Within
        duration={750}
        toggled={isDark}
        toggle={toggleTheme}
        reversed
        style={{
          color: "var(--text)",
          cursor: "pointer",
          width: 24,
          height: 24,
          fontSize: 24,
        }}
      />
    </div>
  );
}
