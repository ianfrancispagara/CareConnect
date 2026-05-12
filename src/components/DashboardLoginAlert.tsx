"use client";

import { useEffect } from "react";
import { useAlert } from "@/hooks/useAlert";

export function DashboardLoginAlert({
  loginToken,
}: {
  loginToken?: string | null;
}) {
  const { showAlert } = useAlert();

  useEffect(() => {
    if (loginToken) {
      showAlert({
        type: "success",
        message: "Signed in successfully!",
        duration: 4000,
      });
    }
  }, [loginToken, showAlert]);

  return null;
}
