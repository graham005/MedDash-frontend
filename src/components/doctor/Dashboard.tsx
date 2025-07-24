import { useMemo, useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDoctorAppointments } from "@/hooks/useAppointments";
import CreateDoctorProfileModal from "./profile/CreateProfile";

export default function DoctorDashboard() {
  // Get doctor info
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  // Get all appointments for the logged-in doctor
  const {
    data: doctorAppointments,
    isLoading: isLoadingDoctorAppointments,
    error: doctorAppointmentsError,
  } = useDoctorAppointments();
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  useEffect(() => {
    // Check if user needs to create a profile
    if (
      currentUser &&
      (!currentUser.profile || Object.keys(currentUser.profile).length === 0)
    ) {
      setShowProfileModal(true);
    }
  }, [currentUser]);

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 lg:px-8 py-4 sm:py-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <div className="text-slate-500 dark:text-slate-300 text-xs sm:text-sm">
            {isLoadingUser
              ? "Loading..."
              : currentUser
              ? `Welcome back, Dr. ${currentUser.profile?.user?.lastName}`
              : "Welcome back"}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 dark:text-slate-300" />
            {/* Notification dot */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="Profile"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-indigo-500"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 lg:p-8 flex flex-col gap-4 sm:gap-6">
        {/* Top Section: Patient Queue & Quick Actions */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          {/* Patient Queue */}
          <section className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow p-3 sm:p-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white">
                Patient Queue
              </h2>
              <span className="text-xs text-slate-400">
                {todayAppointments.length} patients today
              </span>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {patientQueue.length === 0 && (
                <div className="text-slate-400 text-center py-6 sm:py-8 text-sm">
                  No patients in queue today.
                </div>
              )}
              {patientQueue.map((appt, idx) => (
                <div
                  key={appt.patient.id}
                  className="flex items-center gap-3 sm:gap-4 bg-indigo-400 dark:bg-slate-950 rounded-lg p-3 sm:p-4"
                >
                  <img
                    src={`https://randomuser.me/api/portraits/${
                      idx % 2 === 0 ? "women" : "men"
                    }/${44 + idx}.jpg`}
                    alt={appt.patient?.user?.firstName ?? ""}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-semibold text-white text-sm sm:text-base truncate">
                        {appt.patient?.user?.firstName ?? "Unknown"}{" "}
                        {appt.patient?.user?.lastName ?? ""}
                      </span>
                      <span className="text-xs text-slate-100">
                        ID: #{appt.patient?.id?.slice(-5) ?? "-----"}
                      </span>
                    </div>
                    <div className="text-slate-100 text-xs">
                      {appt.availabilitySlot?.type === "EMERGENCY"
                        ? "Emergency consult"
                        : "Consultation"}
                    </div>
                    <div className="text-slate-200 text-xs mt-1">
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
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        appt.availabilitySlot?.type === "EMERGENCY"
                          ? "bg-indigo-500 text-white"
                          : appt.status === "confirmed"
                          ? "bg-blue-400 text-white"
                          : "bg-slate-400 text-white"
                      }`}
                    >
                      {appt.availabilitySlot?.type === "EMERGENCY"
                        ? "URGENT"
                        : appt.status === "confirmed"
                        ? "HIGH"
                        : "NORMAL"}
                    </span>
                    <span className="text-xs text-slate-200 hidden sm:block">
                      Room {201 + idx}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <aside className="w-full xl:w-72 flex-shrink-0 bg-white dark:bg-slate-800 rounded-xl shadow p-3 sm:p-4">
            <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white mb-3 sm:mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-2 sm:gap-3">
              <button className="w-full py-2 sm:py-3 px-3 text-sm sm:text-base rounded bg-indigo-400 hover:bg-indigo-500 text-white font-semibold transition">
                + New Prescription
              </button>
              <button className="w-full py-2 sm:py-3 px-3 text-sm sm:text-base rounded bg-indigo-100 dark:bg-slate-700 hover:bg-indigo-200 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-200 font-semibold transition">
                Refill Request
              </button>
              <button className="w-full py-2 sm:py-3 px-3 text-sm sm:text-base rounded bg-indigo-100 dark:bg-slate-700 hover:bg-indigo-200 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-200 font-semibold transition">
                Drug Lookup
              </button>
              <button className="w-full py-2 sm:py-3 px-3 text-sm sm:text-base rounded bg-indigo-100 dark:bg-slate-700 hover:bg-indigo-200 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-200 font-semibold transition">
                View History
              </button>
            </div>
          </aside>
        </div>

        {/* Today's Appointments */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-3 sm:p-4">
          <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-white mb-3 sm:mb-4">
            Today's Appointments
          </h2>
          {isLoadingDoctorAppointments ? (
            <div className="text-slate-400 text-center py-6 sm:py-8 text-sm">
              Loading appointments...
            </div>
          ) : doctorAppointmentsError ? (
            <div className="text-red-500 text-center py-6 sm:py-8 text-sm">
              Error loading appointments.
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="text-slate-400 text-center py-12 sm:py-20 text-sm">
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              {todayAppointments.map((appt, idx) => (
                <div
                  key={appt.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-4 gap-2 sm:gap-0 ${
                    idx === 2
                      ? "bg-indigo-50 dark:bg-indigo-950 rounded px-2 sm:px-3"
                      : idx === todayAppointments.length - 1
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        idx === 0
                          ? "bg-indigo-700"
                          : idx === 1
                          ? "bg-blue-400"
                          : idx === 2
                          ? "bg-indigo-400"
                          : "bg-slate-300"
                      }`}
                    ></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                        {appt.availabilitySlot?.type === "EMERGENCY"
                          ? "Current: Emergency Consult"
                          : appt.status === "confirmed"
                          ? "Confirmed Consultation"
                          : "Consultation"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300 truncate">
                        Patient:{" "}
                        {appt.patient?.user?.firstName ?? "Unknown"}{" "}
                        {appt.patient?.user?.lastName ?? ""}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs sm:text-sm self-start sm:self-center ${
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

        {/* Profile creation modal */}
        <CreateDoctorProfileModal
          isOpen={showProfileModal}
          onClose={closeProfileModal}
        />
      </main>
    </div>
  );
}