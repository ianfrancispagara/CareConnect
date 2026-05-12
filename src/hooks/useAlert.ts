"use client";

import { useContext } from "react";
import { AlertContext } from "@/components/AlertProvider";

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
}
