"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAvailableTimeSlots } from "@/actions/psg-availability";
import { createAppointment } from "@/actions/appointments";
import { useAlert } from "@/hooks/useAlert";
import type { AvailableTimeSlot } from "@/types/appointments";
import { createClient } from "@/lib/supabase/client";
import { Loader } from "@/components/Loader";

export default function BookAppointmentPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<AvailableTimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableTimeSlot | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [locationType, setLocationType] = useState<"online" | "in_person">(
    "online",
  );
  const [meetingLink, setMeetingLink] = useState("");

  // Date range for slot search
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextWeek);

  const searchSlots = async () => {
    if (!startDate || !endDate) {
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showAlert({
        message: "Start date must be before end date",
        type: "error",
        duration: 5000,
      });
      return;
    }

    try {
      setLoading(true);

      const result = await getAvailableTimeSlots(startDate, endDate, 60);

      if (result.success) {
        setSlots(result.data || []);

        if (!result.data || result.data.length === 0) {
          showAlert({
            message:
              "No available slots found in this date range. PSG members may not have set their availability yet.",
            type: "info",
            duration: 5000,
          });
        }
      } else {
        showAlert({
          message: result.error || "Failed to load available slots",
          type: "error",
          duration: 5000,
        });
      }
    } catch {
      showAlert({
        message: "An unexpected error occurred while searching for slots",
        type: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
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
      setUserId(user.id);
    }
    checkAuth();
  }, [showAlert, router]);

  useEffect(() => {
    // Only search slots if user is authenticated
    if (userId && startDate && endDate) {
      searchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, startDate, endDate]);

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      showAlert({
        message: "Please select a time slot",
        type: "error",
        duration: 5000,
      });
      return;
    }

    // Validate meeting link for online appointments
    if (locationType === "online" && !meetingLink.trim()) {
      showAlert({
        message: "Please provide a meeting link for online appointments",
        type: "error",
        duration: 5000,
      });
      return;
    }

    try {
      setLoading(true);

      const appointmentData = {
        student_id: userId,
        psg_member_id: selectedSlot.psg_member_id,
        appointment_date: selectedSlot.appointment_timestamp,
        duration_minutes: selectedSlot.duration_minutes,
        location_type: locationType,
        meeting_link: locationType === "online" ? meetingLink : undefined,
        notes: notes || undefined,
      };

      // Use the appointment_timestamp from the slot for accurate booking
      // This preserves the exact time in the database timezone (Philippines)
      const result = await createAppointment(appointmentData);

      if (result.success) {
        showAlert({
          message: "Appointment booked successfully!",
          type: "success",
          duration: 5000,
        });
        router.push("/dashboard/appointments");
      } else {
        showAlert({
          message: result.error || "Failed to book appointment",
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
  };

  // Group slots by date
  const slotsByDate = slots.reduce(
    (acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    },
    {} as Record<string, AvailableTimeSlot[]>,
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1
          className="text-base font-bold mb-6"
          style={{ color: "var(--text)" }}
        >
          Book an Appointment
        </h1>

        {/* Date Range Selection */}
        <div
          className="rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] p-6 mb-6"
          style={{
            background: "var(--bg-light)",
            border: "1px solid var(--border-muted)",
          }}
        >
          <h2
            className="text-base font-bold mb-4"
            style={{ color: "var(--text)" }}
          >
            Select Date Range
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  border: "1px solid var(--border-muted)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              />
            </div>
            <div>
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  border: "1px solid var(--border-muted)",
                  background: "var(--bg)",
                  color: "var(--text)",
                }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={searchSlots}
                disabled={loading}
                className="w-full px-6 py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                style={{
                  background: "var(--primary)",
                  color: "var(--bg-dark)",
                }}
              >
                {loading ? "Searching..." : "Search Slots"}
              </button>
            </div>
          </div>
        </div>

        {/* Available Slots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Slots List */}
          <div
            className="rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] p-6"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <h2
              className="text-base font-bold mb-4"
              style={{ color: "var(--text)" }}
            >
              Available Time Slots
            </h2>

            {loading && slots.length === 0 ? (
              <div className="py-8">
                <Loader text="Loading slots..." />
              </div>
            ) : Object.keys(slotsByDate).length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: "var(--text-muted)" }}
              >
                <p>No available slots found. Try a different date range.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date}>
                    <h3
                      className="font-semibold text-lg mb-2 sticky top-0 py-2"
                      style={{
                        background: "var(--bg-light)",
                        color: "var(--text)",
                      }}
                    >
                      {formatDate(date)}
                    </h3>
                    <div className="space-y-2">
                      {dateSlots.map((slot, idx) => (
                        <button
                          key={`${slot.psg_member_id}-${slot.start_time}-${idx}`}
                          onClick={() => setSelectedSlot(slot)}
                          className="w-full text-left p-4 rounded-lg transition-all"
                          style={{
                            border:
                              selectedSlot === slot
                                ? "2px solid var(--primary)"
                                : "1px solid var(--border-muted)",
                            background:
                              selectedSlot === slot
                                ? "var(--success-bg)"
                                : "var(--bg)",
                            color: "var(--text)",
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p
                                className="font-medium"
                                style={{ color: "var(--text)" }}
                              >
                                {slot.psg_member_name}
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {slot.start_time} - {slot.end_time}
                              </p>
                            </div>
                            <div
                              className="text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {slot.duration_minutes} min
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div
            className="rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.015)] p-6 h-fit sticky top-4"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <h2
              className="text-base font-bold mb-4"
              style={{ color: "var(--text)" }}
            >
              Booking Summary
            </h2>

            {selectedSlot ? (
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    PSG Member
                  </label>
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    {selectedSlot.psg_member_name}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Date
                  </label>
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    {formatDate(selectedSlot.date)}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Time
                  </label>
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    {selectedSlot.start_time} - {selectedSlot.end_time}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Duration
                  </label>
                  <p className="font-medium" style={{ color: "var(--text)" }}>
                    {selectedSlot.duration_minutes} minutes
                  </p>
                </div>

                <div>
                  <label
                    className="block mb-2 text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    Location Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLocationType("online")}
                      className="px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                      style={{
                        border:
                          locationType === "online"
                            ? "2px solid var(--primary)"
                            : "1px solid var(--border-muted)",
                        background:
                          locationType === "online"
                            ? "var(--primary-20)"
                            : "var(--bg)",
                        color:
                          locationType === "online"
                            ? "var(--primary)"
                            : "var(--text)",
                      }}
                    >
                      Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationType("in_person")}
                      className="px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                      style={{
                        border:
                          locationType === "in_person"
                            ? "2px solid var(--primary)"
                            : "1px solid var(--border-muted)",
                        background:
                          locationType === "in_person"
                            ? "var(--primary-20)"
                            : "var(--bg)",
                        color:
                          locationType === "in_person"
                            ? "var(--primary)"
                            : "var(--text)",
                      }}
                    >
                      In Person
                    </button>
                  </div>
                </div>

                {locationType === "online" && (
                  <div>
                    <label
                      className="block mb-2 text-sm font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      Meeting Link{" "}
                      <span style={{ color: "var(--error)" }}>*</span>
                    </label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        border: "1px solid var(--border-muted)",
                        background: "var(--bg)",
                        color: "var(--text)",
                      }}
                    />
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Google Meet, Zoom, or any video conferencing link
                    </p>
                  </div>
                )}

                <div>
                  <label
                    className="block mb-2 text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or concerns..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg resize-none"
                    style={{
                      border: "1px solid var(--border-muted)",
                      background: "var(--bg)",
                      color: "var(--text)",
                    }}
                  />
                </div>

                <button
                  onClick={handleBookAppointment}
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 font-medium"
                  style={{
                    background: "var(--primary)",
                    color: "var(--bg-dark)",
                  }}
                >
                  {loading ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            ) : (
              <div
                className="text-center py-8"
                style={{ color: "var(--text-muted)" }}
              >
                <p>Select a time slot to see booking details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
