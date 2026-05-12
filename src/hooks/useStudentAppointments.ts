"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStudentAppointments } from "@/actions/appointments";
import { useAlert } from "@/hooks/useAlert";
import { createClient } from "@/lib/supabase/client";
import type { AppointmentWithProfiles } from "@/types/appointments";
import {
  DEFAULT_APPOINTMENT_FILTER,
  filterAndSortAppointments,
  type AppointmentFilter,
} from "@/lib/utils/student-appointments";

export function useStudentAppointments() {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [appointments, setAppointments] = useState<AppointmentWithProfiles[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentFilter>(
    DEFAULT_APPOINTMENT_FILTER,
  );

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        showAlert({
          message: "Please login first",
          type: "error",
          duration: 5000,
        });
        router.push("/login");
        return;
      }

      const result = await getStudentAppointments(user.id);

      if (result.success && result.data) {
        setAppointments(result.data);
      } else {
        showAlert({
          message: result.error || "Failed to load appointments",
          type: "error",
          duration: 5000,
        });
      }
    } catch {
      showAlert({
        message: "An unexpected error occurred",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [router, showAlert]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = useMemo(
    () => filterAndSortAppointments(appointments, filter),
    [appointments, filter],
  );

  return {
    filteredAppointments,
    loading,
    filter,
    setFilter,
  };
}
