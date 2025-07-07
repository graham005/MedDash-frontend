import { useMemo } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { ModeToggle } from "../mode-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";

export default function DoctorDashboard() {
  // Get doctor info
  const { currentUser, isLoading: isLoadingUser } = useAuth();
  // Get all appointments for the logged-in doctor
  const {
    doctorAppointments,
    isLoadingDoctorAppointments,
    doctorAppointmentsError,
  } = useAppointments();

  // Filter today's appointments
  const today = new Date();
  const todayAppointments = useMemo(() => {
    if (!doctorAppointments) return [];
    return doctorAppointments.filter((appt) => {
      const apptDate = new Date(appt.startTime);
      return (
        apptDate.getFullYear() === today.getFullYear() &&
        apptDate.getMonth() === today.getMonth() &&
        apptDate.getDate() === today.getDate()
      );
    });
  }, [doctorAppointments]);

  // Patient queue: first 3 patients with appointments today
  const patientQueue = useMemo(() => {
    if (!todayAppointments) return [];
    // Remove duplicate patients by patient id
    const seen = new Set();
    const uniquePatients = todayAppointments.filter((appt) => {
      if (seen.has(appt.patient.id)) return false;
      seen.add(appt.patient.id);
      return true;
    });
    return uniquePatients.slice(0, 3);
  }, [todayAppointments]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors w-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 w-full">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <div className="text-slate-500 dark:text-slate-300 text-sm">
            {isLoadingUser
              ? "Loading..."
              : currentUser
              ? `Welcome back, Dr. ${currentUser.lastName}`
              : "Welcome back"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <BellIcon className="w-6 h-6 text-slate-500 dark:text-slate-300" />
            {/* Notification dot */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          <ModeToggle />
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="Profile"
            className="w-9 h-9 rounded-full border-2 border-indigo-500"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8 flex flex-col gap-6 w-full">
        {/* Top Section: Patient Queue & Quick Actions */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Patient Queue */}
          <section className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow p-4 min-w-0 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
                Patient Queue
              </h2>
              <span className="text-xs text-slate-400">
                {todayAppointments.length} patients today
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {patientQueue.length === 0 && (
                <div className="text-slate-400 text-center py-8">
                  No patients in queue today.
                </div>
              )}
              {patientQueue.map((appt, idx) => (
                <div
                  key={appt.patient.id}
                  className="flex items-center gap-4 bg-slate-900 dark:bg-slate-950 rounded-lg p-4"
                >
                  <img
                    src={`https://randomuser.me/api/portraits/${
                      idx % 2 === 0 ? "women" : "men"
                    }/${44 + idx}.jpg`}
                    alt={appt.patient.user.firstName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {appt.patient.user.firstName} {appt.patient.user.lastName}
                      </span>
                      <span className="text-xs text-slate-300">
                        ID: #{appt.patient.id.slice(-5)}
                      </span>
                    </div>
                    <div className="text-slate-300 text-xs">
                      {appt.availabilitySlot?.type === "EMERGENCY"
                        ? "Emergency consult"
                        : "Consultation"}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      {/* Wait time: difference between now and appointment start */}
                      Wait time:{" "}
                      {Math.max(
                        0,
                        Math.round(
                          (new Date(appt.startTime).getTime() - Date.now()) / 60000
                        )
                      )}{" "}
                      min
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      appt.availabilitySlot?.type === "EMERGENCY"
                        ? "bg-indigo-500 text-white"
                        : appt.status === "CONFIRMED"
                        ? "bg-blue-400 text-white"
                        : "bg-slate-400 text-white"
                    }`}
                  >
                    {appt.availabilitySlot?.type === "EMERGENCY"
                      ? "URGENT"
                      : appt.status === "CONFIRMED"
                      ? "HIGH"
                      : "NORMAL"}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    Room {201 + idx}
                  </span>
                </div>
              ))}
            </div>
          </section>
          {/* Quick Actions */}
          <aside className="w-full lg:w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
              Quick Actions
            </h2>
            <button className="w-full py-2 rounded bg-indigo-400 hover:bg-indigo-500 text-white font-semibold transition">
              + New Prescription
            </button>
            <button className="w-full py-2 rounded bg-indigo-100 dark:bg-slate-700 hover:bg-indigo-200 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-200 font-semibold transition">
              Refill Request
            </button>
            <button className="w-full py-2 rounded bg-indigo-100 dark:bg-slate-700 hover:bg-indigo-200 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-200 font-semibold transition">
              Drug Lookup
            </button>
            <button className="w-full py-2 rounded bg-indigo-100 dark:bg-slate-700 hover:bg-indigo-200 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-200 font-semibold transition">
              View History
            </button>
          </aside>
        </div>

        {/* Today's Appointments */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 w-full">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white mb-4">
            Today's Appointments
          </h2>
          {isLoadingDoctorAppointments ? (
            <div className="text-slate-400 text-center py-8">
              Loading appointments...
            </div>
          ) : doctorAppointmentsError ? (
            <div className="text-red-500 text-center py-8">
              Error loading appointments.
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              {todayAppointments.map((appt, idx) => (
                <div
                  key={appt.id}
                  className={`flex items-center justify-between py-3 ${
                    idx === 2
                      ? "bg-indigo-50 dark:bg-indigo-950 rounded"
                      : idx === todayAppointments.length - 1
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        idx === 0
                          ? "bg-indigo-700"
                          : idx === 1
                          ? "bg-blue-400"
                          : idx === 2
                          ? "bg-indigo-400"
                          : "bg-slate-300"
                      }`}
                    ></span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {appt.availabilitySlot?.type === "EMERGENCY"
                          ? "Current: Emergency Consult"
                          : appt.status === "CONFIRMED"
                          ? "Confirmed Consultation"
                          : "Consultation"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300">
                        Patient: {appt.patient.user.firstName}{" "}
                        {appt.patient.user.lastName}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs ${
                      idx === 2
                        ? "text-indigo-700 dark:text-indigo-300 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {new Date(appt.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}