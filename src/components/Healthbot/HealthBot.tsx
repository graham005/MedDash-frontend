import React, { useRef, useEffect, useState, useMemo } from "react";
import { useHealthBot } from "@/hooks/useHealthBot";
import { useAllAvailabilitySlots } from "@/hooks/useAvailability";
import { Button } from "@/components/ui/button";

export default function HealthBot() {
  const {
    messages,
    sendMessage,
    loading,
    error,
    showAppointmentForm,
    setShowAppointmentForm,
    appointmentFormData,
    setAppointmentFormData,
    submitAppointmentForm,
    appointmentSuccess,
  } = useHealthBot();
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all doctor availability slots
  const { data: allSlots = [] } = useAllAvailabilitySlots();

  // Extract unique doctors from slots
  const doctorOptions = useMemo(() => {
    const seen: Record<string, boolean> = {};
    return allSlots
      .filter((slot: any) => slot.doctor && slot.doctor.user)
      .filter((slot: any) => {
        if (seen[slot.doctor.id]) return false;
        seen[slot.doctor.id] = true;
        return true;
      })
      .map((slot: any) => ({
        id: slot.doctor.id,
        name: `Dr. ${slot.doctor.user.firstName} ${slot.doctor.user.lastName}`,
      }));
  }, [allSlots]);

  // Filter slots for selected doctor and future dates
  const availableSlots = useMemo(() => {
    if (!appointmentFormData.doctorId) return [];
    const now = new Date();
    return allSlots
      .filter(
        (slot: any) =>
          slot.doctor?.id === appointmentFormData.doctorId &&
          new Date(slot.startTime) > now &&
          !slot.isBooked // Only show slots that are not booked
      )
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [allSlots, appointmentFormData.doctorId]);

  // Find the selected slot object (to get its id and times)
  const selectedSlot = useMemo(() => {
    if (!appointmentFormData.doctorId || !appointmentFormData.date || !appointmentFormData.time) return null;
    return availableSlots.find((slot: any) => {
      const start = new Date(slot.startTime);
      const dateStr = start.toISOString().slice(0, 10);
      const timeStr = start.toTimeString().slice(0, 5);
      return (
        dateStr === appointmentFormData.date &&
        timeStr === appointmentFormData.time
      );
    });
  }, [availableSlots, appointmentFormData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showAppointmentForm, appointmentSuccess]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-xl shadow-2xl bg-white dark:bg-slate-900 flex flex-col h-[500px] border border-gray-200 dark:border-slate-700">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-blue-50 dark:bg-slate-800 rounded-t-xl">
        <span className="text-2xl">🤖</span>
        <span className="font-semibold text-blue-900 dark:text-blue-200 text-base">
          MedBot
        </span>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          AI Assistant
        </span>
      </div>
      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-white dark:bg-slate-900">
        {messages
          .filter((m) => m.role !== "system")
          .map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        {/* Appointment Form Bubble */}
        {showAppointmentForm && (
          <div className="mb-3 flex justify-start">
            <div className="rounded-2xl px-4 py-3 max-w-[90%] shadow-sm bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-bl-none">
              <form
                className="flex flex-col gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  // Pass slot id, startTime, and endTime to the hook
                  await submitAppointmentForm({
                    availabilitySlotId: selectedSlot?.id || "",
                    startTime: selectedSlot?.startTime || "",
                    endTime: selectedSlot?.endTime || "",
                  });
                }}
              >
                <div>
                  <label className="block text-xs mb-1">Doctor</label>
                  <select
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    value={appointmentFormData.doctorId}
                    onChange={(e) =>
                      setAppointmentFormData((prev) => ({
                        ...prev,
                        doctorId: e.target.value,
                        date: "",
                        time: "",
                      }))
                    }
                    required
                  >
                    <option value="">Select doctor</option>
                    {doctorOptions.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Date & Time</label>
                  <select
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    value={
                      appointmentFormData.date && appointmentFormData.time
                        ? `${appointmentFormData.date}T${appointmentFormData.time}`
                        : ""
                    }
                    onChange={(e) => {
                      const [date, time] = e.target.value.split("T");
                      setAppointmentFormData((prev) => ({
                        ...prev,
                        date,
                        time,
                      }));
                    }}
                    required
                    disabled={!appointmentFormData.doctorId}
                  >
                    <option value="">Select date & time</option>
                    {availableSlots.map((slot: any) => {
                      const start = new Date(slot.startTime);
                      const dateStr = start.toISOString().slice(0, 10);
                      const timeStr = start.toTimeString().slice(0, 5);
                      return (
                        <option key={slot.id} value={`${dateStr}T${timeStr}`}>
                          {`${dateStr} at ${timeStr}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1">Reason</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    value={appointmentFormData.reason}
                    onChange={(e) =>
                      setAppointmentFormData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    placeholder="Reason for visit"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                  >
                    Book
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="px-4 py-1"
                    onClick={() => setShowAppointmentForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
                {appointmentSuccess && (
                  <div className="text-green-600 dark:text-green-400 text-xs mt-2">
                    {appointmentSuccess}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
        {loading && (
          <div className="flex justify-start mb-2">
            <div className="bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-2xl px-4 py-2 shadow-sm">
              HealthBot is typing...
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start mb-2">
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-2xl px-4 py-2 shadow-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {/* Chat Input */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2 rounded-b-xl"
      >
        <input
          className="flex-1 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask HealthBot anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || showAppointmentForm}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim() || showAppointmentForm}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Send
        </Button>
      </form>
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center pb-2 pt-1">
        I am not a doctor. For medical emergencies, contact a healthcare
        professional.
      </div>
    </div>
  );
}