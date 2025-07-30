import { useState } from "react";
import { sendToHealthBot, type HealthBotMessage } from "@/api/healthBotApi";
import { useNavigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePatientAppointments } from "@/hooks/useAppointments";
import { usePrescriptions } from "@/hooks/usePrescriptions";
import { useMedicines } from "@/hooks/usePharmacy";
import { usePharmacyOrders } from "@/hooks/usePharmacy";
import { useCreateAppointment } from "@/hooks/useAppointments";

const SYSTEM_PROMPT = `
You are HealthBot, a helpful, privacy-conscious healthcare assistant for a web app. 
- Never answer questions that are not related to health or medical 
- If asked question that are not related to health and medicine, reply with you are a medical assistant and cant answer questions not relating to medicine.
- Never give a diagnosis or personal medical advice.
- For navigation requests, reply with: NAVIGATE:<route>
- For booking appointments, reply with: BOOK_APPOINTMENT
- For viewing prescriptions, reply with: SHOW_PRESCRIPTIONS
- For medicine info, reply with: MEDICINE_INFO:<medicine_name>
- For available doctors, reply with: SHOW_DOCTORS
- For general medical questions, answer factually and briefly.
`;

export function useHealthBot() {
  const [messages, setMessages] = useState<HealthBotMessage[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentFormData, setAppointmentFormData] = useState({
    doctorId: "",
    date: "",
    time: "",
    reason: "",
  });
  const [appointmentSuccess, setAppointmentSuccess] = useState<string | null>(null);

  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();

  // Data hooks
  const { data: appointments = [] } = usePatientAppointments();
  const { data: prescriptions = [] } = usePrescriptions();
  const { data: medicines = [] } = useMedicines();
  const { data: pharmacyOrders = [] } = usePharmacyOrders();
  const createAppointment = useCreateAppointment();

  // Helper: Format lists for chat bubbles
  function formatAppointments() {
    if (!appointments.length) return "You have no upcoming appointments.";
    return (
      "Your appointments:\n" +
      appointments
        .map(
          (a: any, i: number) =>
            `${i + 1}. ${a.doctor?.user?.firstName || "Doctor"} ${a.doctor?.user?.lastName || ""} on ${new Date(a.date).toLocaleString()} (${a.status})`
        )
        .join("\n")
    );
  }

  function formatPrescriptions() {
    if (!prescriptions.length) return "You have no prescriptions.";
    return (
      "Your prescriptions:\n" +
      prescriptions
        .map(
          (p: any, i: number) =>
            `${i + 1}. ${p.name} (Prescribed: ${new Date(p.date).toLocaleDateString()})`
        )
        .join("\n")
    );
  }

  function formatMedicinesForPrescription(prescriptionName: string) {
    const prescription = prescriptions.find(
      (p: any) => p.name.toLowerCase() === prescriptionName.toLowerCase()
    );
    if (!prescription) return "Prescription not found.";
    if (!prescription.medications?.length) return "No medicines found for this prescription.";
    return (
      `Medicines for "${prescription.name}":\n` +
      prescription.medications
        .map(
          (m: any, i: number) =>
            `${i + 1}. ${medicines.find((med) => med.id === m.medicineId)?.name || m.medicineId} - ${m.dosage}, ${m.frequency}, ${m.duration}`
        )
        .join("\n")
    );
  }

  function formatDoctors() {
    // If you have a hook for doctors, use it. Here is a mock:
    const doctors = [
      { id: "1", name: "Dr. Jane Doe", specialty: "Cardiology", available: "Mon, Wed 10am-2pm" },
      { id: "2", name: "Dr. John Smith", specialty: "Dermatology", available: "Tue, Thu 1pm-5pm" },
    ];
    return (
      "Available doctors:\n" +
      doctors.map((d, i) => `${i + 1}. ${d.name} (${d.specialty}) - ${d.available}`).join("\n")
    );
  }

  // Intent handlers (API or mock)
  async function handleIntent(intent: string, arg?: string) {
    // Navigation
    if (intent.startsWith("NAVIGATE:")) {
      if (!currentUser) return "Please log in to access this section.";
      const route = intent.replace("NAVIGATE:", "");
      // Map AI route to your actual route
      let actualRoute = route;
      if (route === "/appointments") actualRoute = "/dashboard/patient/appointments";
      if (route === "/prescriptions") actualRoute = "/dashboard/patient/prescriptions";
      if (route === "/doctors") actualRoute = "/dashboard/patient/book-appointment";
      navigate({ to: actualRoute });
      return "Navigating you now!";
    }
    // Book appointment: show form in chat
    if (intent === "BOOK_APPOINTMENT") {
      if (!currentUser) return "Please log in to book an appointment.";
      setShowAppointmentForm(true);
      setAppointmentSuccess(null);
      return "Please fill out the form below to book an appointment.";
    }
    // Show prescriptions
    if (intent === "SHOW_PRESCRIPTIONS") {
      if (!currentUser) return "Please log in to view your prescriptions.";
      return formatPrescriptions();
    }
    // Show medicines for a prescription
    if (intent.startsWith("GET_MEDICINES_FOR_PRESCRIPTION:")) {
      if (!currentUser) return "Please log in to view your prescriptions.";
      const prescriptionName = arg || intent.split(":")[1];
      return formatMedicinesForPrescription(prescriptionName);
    }
    // Show appointments
    if (intent === "SHOW_APPOINTMENTS") {
      if (!currentUser) return "Please log in to view your appointments.";
      return formatAppointments();
    }
    // Medicine info (public)
    if (intent.startsWith("MEDICINE_INFO:")) {
      const medName = arg || intent.split(":")[1];
      const med = medicines.find(
        (m: any) => m.name.toLowerCase() === medName.toLowerCase()
      );
      if (med) {
        return `Medicine: ${med.name}`;
      }
      return `Here is information about ${medName} (uses, side effects, etc.).`;
    }
    // Show doctors
    if (intent === "SHOW_DOCTORS") {
      return formatDoctors();
    }
    return null;
  }

  // Handle appointment form submission
  async function submitAppointmentForm({
    availabilitySlotId,
    startTime,
    endTime,
  }: { availabilitySlotId: string; startTime: string; endTime: string }) {
    if (!currentUser) {
      setAppointmentSuccess(null);
      setShowAppointmentForm(false);
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: "You must be logged in to book an appointment." },
      ]);
      return;
    }
    try {
      await createAppointment.mutateAsync({
        doctorId: appointmentFormData.doctorId,
        patientId: currentUser.id,
        startTime,
        endTime,
        reasonForVisit: appointmentFormData.reason,
        availabilitySlotId,
      });
      setAppointmentSuccess("Appointment booked successfully!");
      setShowAppointmentForm(false);
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: "Your appointment has been booked successfully!" },
      ]);
    } catch (err: any) {
      setAppointmentSuccess(null);
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: "Failed to book appointment. Please try again." },
      ]);
    }
  }

  async function sendMessage(userMessage: string) {
    setLoading(true);
    setError(null);
    const newMessages: HealthBotMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);

    try {
      const aiResponse = await sendToHealthBot(newMessages);
      // Check for intent commands in the AI response
      const intentMatch = aiResponse.match(
        /^(NAVIGATE|BOOK_APPOINTMENT|SHOW_PRESCRIPTIONS|SHOW_APPOINTMENTS|GET_MEDICINES_FOR_PRESCRIPTION|MEDICINE_INFO|SHOW_DOCTORS)(:.*)?/
      );
      if (intentMatch) {
        const intent = intentMatch[1];
        const arg = intentMatch[2]?.slice(1);
        const handled = await handleIntent(intentMatch[0], arg);

        // Filter out AI's login warning if user is logged in
        const loginWarning = /log\s?in|sign\s?in|need to be logged in/i;
        const shouldShowHandled =
          !(currentUser && handled && loginWarning.test(handled))
            ? handled
            : null;

        setMessages((msgs) => [
          ...msgs,
          { role: "assistant", content: shouldShowHandled || aiResponse },
        ]);
      } else {
        setMessages((msgs) => [
          ...msgs,
          { role: "assistant", content: aiResponse },
        ]);
      }
    } catch (err: any) {
      setError("Failed to contact HealthBot.");
    } finally {
      setLoading(false);
    }
  }

  // Expose form state and handlers for the chat UI
  return {
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
  };
}