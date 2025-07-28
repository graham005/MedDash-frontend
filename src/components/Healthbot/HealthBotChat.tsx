// filepath: c:\Users\The Elder\Documents\Teach2Give\Final Project\meddash-frontend\src\components\Healthbot\HealthBotChat.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User, AlertTriangle, Phone, Calendar, UserCheck, Pill, LogIn } from 'lucide-react';
import { useHealthBot } from '../../hooks/useHealthBot';
import { useCurrentUser } from '@/hooks/useAuth';
import { useAllAvailabilitySlots } from '@/hooks/useAvailability';
import { useNavigate } from '@tanstack/react-router';
import {
  PrescriptionCard,
  MedicineSearch,
  LoginPrompt,
  type Medicine,
  type Prescription
} from './MedicineComponents';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  escalate?: boolean;
  reasoning?: string;
  showAppointmentForm?: boolean;
  showAppointmentList?: boolean;
  showMedicineSearch?: boolean;
  showPrescriptions?: boolean;
  showLoginPrompt?: boolean;
  medicines?: Medicine[];
  prescriptions?: Prescription[];
}

interface HealthBotChatProps {
  className?: string;
}

interface AppointmentFormData {
  doctorId: string;
  availabilitySlotId: string;
  startTime: string;
  endTime: string;
  reasonForVisit: string;
}

interface DoctorWithAvailability {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  consultationFee: number;
  availableSlots: {
    id: string;
    startTime: string;
    endTime: string;
    type?: 'standard' | 'emergency' | 'consultation';
  }[];
}

export const HealthBotChat: React.FC<HealthBotChatProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(
    [
      {
        id: '1',
        type: 'bot',
        content: "👋 Hello! I'm your health assistant. I'm here to help with medication questions, post-visit instructions, general health guidance, and appointment management. How can I assist you today?",
        timestamp: new Date(),
      },
    ]
  );
  const [inputValue, setInputValue] = useState('');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [medicineSearchResults, setMedicineSearchResults] = useState<Medicine[]>([]);
  const [userPrescriptions, setUserPrescriptions] = useState<Prescription[]>([]);
  const [appointmentFormData, setAppointmentFormData] = useState<AppointmentFormData>(
    {
      doctorId: '',
      availabilitySlotId: '',
      startTime: '',
      endTime: '',
      reasonForVisit: '',
    }
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    askQuestion,
    askQuestionAuthenticated,
    handleEmergency,
    scheduleAppointment,
    getUserPrescriptions,
    getMedicineInfo,
    getMedicineSideEffects,
    getMedicineUsage,
    searchMedicines,
    isLoading,
    error,
    isAuthenticated
  } = useHealthBot();

  const { data: currentUser } = useCurrentUser();
  const { data: allAvailabilitySlots = [], isLoading: isLoadingSlots } = useAllAvailabilitySlots();

  // Process availability slots to get doctors with their available slots
  const doctorsWithAvailability = useMemo(
    () => {
      if (!allAvailabilitySlots.length) return [];

      const doctorMap = new Map<string, DoctorWithAvailability>();

      allAvailabilitySlots.forEach(slot => {
        const slotDate = new Date(slot.startTime);
        const now = new Date();

        if (!slot.isBooked && slotDate > now) {
          const doctorId = slot.doctor.id;

          if (!doctorMap.has(doctorId)) {
            doctorMap.set(doctorId, {
              id: doctorId,
              firstName: slot.doctor.user.firstName,
              lastName: slot.doctor.user.lastName,
              email: slot.doctor.user.email,
              specialization: slot.doctor.specialization,
              qualification: slot.doctor.qualification,
              licenseNumber: slot.doctor.licenseNumber,
              consultationFee: slot.doctor.consultationFee,
              availableSlots: []
            });
          }

          const doctor = doctorMap.get(doctorId)!;
          doctor.availableSlots.push({
            id: slot.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            type: slot.type
          });
        }
      });

      // Convert map to array and sort by doctor name
      return Array.from(doctorMap.values()).sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    },
    [allAvailabilitySlots]
  );

  // Get available slots for selected doctor
  const availableSlotsForSelectedDoctor = useMemo(
    () => {
      if (!appointmentFormData.doctorId) return [];

      const selectedDoctor = doctorsWithAvailability.find(
        doctor => doctor.id === appointmentFormData.doctorId
      );

      return selectedDoctor?.availableSlots || [];
    },
    [appointmentFormData.doctorId, doctorsWithAvailability]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(
    () => {
      scrollToBottom();
    },
    [messages]
  );

  const detectMedicineIntent = (question: string): boolean => {
    const medicineKeywords = [
      'medicine', 'medication', 'drug', 'prescription', 'side effects',
      'what does', 'my medicines', 'pills', 'dosage', 'how to take'
    ];

    const questionLower = question.toLowerCase();
    return medicineKeywords.some(keyword => questionLower.includes(keyword));
  };

  const detectAppointmentIntent = (question: string): boolean => {
    const appointmentKeywords = [
      'schedule', 'book', 'appointment', 'appointments', 'my appointments',
      'upcoming appointments', 'cancel appointment', 'reschedule', 'available doctors',
      'book consultation', 'see doctor', 'visit doctor'
    ];

    const questionLower = question.toLowerCase();
    return appointmentKeywords.some(keyword => questionLower.includes(keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue.trim();
    setInputValue('');

    try {
      let response;

      if (isEmergencyMode) {
        response = await handleEmergency(question);
      } else {
        const isMedicineQuery = detectMedicineIntent(question);
        const isAppointmentQuery = detectAppointmentIntent(question);

        if ((isMedicineQuery || isAppointmentQuery) && !isAuthenticated) {
          // Show login prompt for medicine/appointment queries when not authenticated
          const loginPromptMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: `🔒 **Authentication Required**

To access ${isMedicineQuery ? 'your medicine information' : 'appointment features'}, you need to be logged in.

${isMedicineQuery ? 
`💊 **Medicine Features Available:**
• View your current prescriptions
• Get detailed medicine information
• Learn about side effects and proper usage
• Receive personalized dosage guidance` :
`📅 **Appointment Features Available:**
• View your upcoming appointments
• Schedule new consultations
• Cancel or reschedule visits
• Access appointment history`}

Please log in to continue with personalized healthcare assistance.`,
            timestamp: new Date(),
            showLoginPrompt: true,
          };

          setMessages(prev => [...prev, loginPromptMessage]);
          return;
        }

        if ((isMedicineQuery || isAppointmentQuery) && isAuthenticated) {
          response = await askQuestionAuthenticated(question);
        } else {
          response = await askQuestion(question);
        }
      }

      // Check what special UI components to show
      const shouldShowAppointmentForm = question.toLowerCase().includes('schedule') ||
        question.toLowerCase().includes('book appointment');
      const shouldShowAppointmentList = question.toLowerCase().includes('my appointments') ||
        question.toLowerCase().includes('upcoming');
      const shouldShowMedicineSearch = question.toLowerCase().includes('search medicine') ||
        question.toLowerCase().includes('find medicine');
      const shouldShowPrescriptions = question.toLowerCase().includes('my prescription') ||
        question.toLowerCase().includes('my medicines');

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
        escalate: response.escalate,
        reasoning: response.reasoning,
        showAppointmentForm: shouldShowAppointmentForm && isAuthenticated,
        showAppointmentList: shouldShowAppointmentList && isAuthenticated,
        showMedicineSearch: shouldShowMedicineSearch && isAuthenticated,
        showPrescriptions: shouldShowPrescriptions && isAuthenticated,
      };

      setMessages(prev => [...prev, botMessage]);

      // Load prescriptions if needed
      if (shouldShowPrescriptions && isAuthenticated) {
        try {
          const prescriptions = await getUserPrescriptions();
          setUserPrescriptions(prescriptions);
        } catch (err) {
          console.error('Failed to load prescriptions:', err);
        }
      }

      // Reset emergency mode after handling
      if (isEmergencyMode) {
        setIsEmergencyMode(false);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or contact your healthcare provider if it's urgent.",
        timestamp: new Date(),
        escalate: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Medicine-related handlers
  const handleMedicineInfo = async (medicineName: string) => {
    try {
      const response = await getMedicineInfo(medicineName);
      const infoMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
      };
      setMessages(prev => [...prev, infoMessage]);
    } catch (err) {
      console.error('Failed to get medicine info:', err);
    }
  };

  const handleMedicineSideEffects = async (medicineName: string) => {
    try {
      const response = await getMedicineSideEffects(medicineName);
      const sideEffectsMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
      };
      setMessages(prev => [...prev, sideEffectsMessage]);
    } catch (err) {
      console.error('Failed to get side effects:', err);
    }
  };

  const handleMedicineUsage = async (medicineName: string) => {
    try {
      const response = await getMedicineUsage(medicineName);
      const usageMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
      };
      setMessages(prev => [...prev, usageMessage]);
    } catch (err) {
      console.error('Failed to get medicine usage:', err);
    }
  };

  const handleMedicineSearch = async (query: string) => {
    try {
      const results = await searchMedicines(query);
      setMedicineSearchResults(results);
    } catch (err) {
      console.error('Failed to search medicines:', err);
      setMedicineSearchResults([]);
    }
  };

  const handleMedicineSelect = (medicine: Medicine) => {
    setInputValue(`Tell me about ${medicine.name}`);
    setShowMedicineSearch(false);
  };

  // Quick action handlers
  const handleQuickPrescriptions = async () => {
    if (!isAuthenticated) {
      // Show login prompt if not authenticated
      const loginMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `🔒 **Login Required**

To view your prescriptions, please log in first.

💊 **After logging in, you can:**
• View all your current prescriptions
• See medicine details and dosages
• Get information about side effects
• Access prescribing doctor information`,
        timestamp: new Date(),
        showLoginPrompt: true,
      };
      setMessages(prev => [...prev, loginMessage]);
      return;
    }

    try {
      const prescriptions = await getUserPrescriptions();
      setUserPrescriptions(prescriptions);
      
      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: prescriptions.length > 0 
          ? `📋 **Your Prescriptions**\n\nI've loaded your ${prescriptions.length} prescription(s). You can see them displayed below with detailed information about each medicine.`
          : `📋 **No Prescriptions Found**\n\nYou don't have any prescriptions in your records yet. Contact your healthcare provider to add prescriptions to the system.`,
        timestamp: new Date(),
        confidence: 0.95,
        sources: ['Prescription Database'],
        showPrescriptions: prescriptions.length > 0,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Failed to get prescriptions:', err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ **Error Loading Prescriptions**\n\nI'm having trouble accessing your prescription information right now. Please try again later or contact support if the problem persists.`,
        timestamp: new Date(),
        escalate: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickMedicines = async () => {
    if (!isAuthenticated) {
      // Show login prompt if not authenticated
      const loginMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `🔒 **Login Required**

To view your medicines, please log in first.

💊 **After logging in, you can:**
• View all medicines from your prescriptions
• See dosage and frequency information
• Learn about side effects and usage
• Get detailed medicine descriptions`,
        timestamp: new Date(),
        showLoginPrompt: true,
      };
      setMessages(prev => [...prev, loginMessage]);
      return;
    }

    try {
      // Use the authenticated question API to get medicines
      const response = await askQuestionAuthenticated("show me my medicines");
      
      const botMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
        escalate: response.escalate,
        reasoning: response.reasoning,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Failed to get medicines:', err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ **Error Loading Medicines**\n\nI'm having trouble accessing your medicine information right now. Please try again later or contact support if the problem persists.`,
        timestamp: new Date(),
        escalate: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleLogin = () => {
    navigate({ to: '/login'});
  };

  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false);
  };

  // Appointment handlers (existing code...)
  const handleAppointmentSubmit = async () => {
    if (!appointmentFormData.doctorId || !appointmentFormData.availabilitySlotId || !appointmentFormData.reasonForVisit) {
      return;
    }

    try {
      const appointmentData = {
        doctorId: appointmentFormData.doctorId,
        patientId: currentUser?.id || '',
        startTime: appointmentFormData.startTime,
        endTime: appointmentFormData.endTime,
        availabilitySlotId: appointmentFormData.availabilitySlotId,
        reasonForVisit: appointmentFormData.reasonForVisit,
        status: 'booked' as const,
      };

      await scheduleAppointment(appointmentData);

      const successMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `✅ **Appointment Scheduled Successfully!**\n\nYour appointment has been booked. You'll receive a confirmation shortly. You can view your appointments by asking "show my appointments".`,
        timestamp: new Date(),
        confidence: 1.0,
        sources: ['Appointment System'],
      };

      setMessages(prev => [...prev, successMessage]);
      setShowAppointmentForm(false);
      setAppointmentFormData({
        doctorId: '',
        availabilitySlotId: '',
        startTime: '',
        endTime: '',
        reasonForVisit: '',
      });
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ **Appointment Booking Failed**\n\nSorry, I couldn't schedule your appointment. Please try again or contact support for assistance.`,
        timestamp: new Date(),
        escalate: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    const selectedDoctor = doctorsWithAvailability.find(d => d.id === doctorId);
    if (selectedDoctor) {
      setAppointmentFormData(prev => ({
        ...prev,
        doctorId,
        availabilitySlotId: '', // Reset slot selection when doctor changes
        startTime: '',
        endTime: '',
      }));
    }
  };

  const handleSlotSelect = (slotId: string) => {
    const selectedSlot = availableSlotsForSelectedDoctor.find(s => s.id === slotId);
    if (selectedSlot) {
      setAppointmentFormData(prev => ({
        ...prev,
        availabilitySlotId: slotId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      }));
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };

    return {
      date: date.toLocaleDateString('en-US', dateOptions),
      time: date.toLocaleTimeString('en-US', timeOptions)
    };
  };

  // Component definitions (AppointmentForm remains the same...)
  const AppointmentForm = React.memo(() => {
    return (
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Appointment
        </h4>

        {isLoadingSlots ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading available doctors...
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Doctor ({doctorsWithAvailability.length} available)
              </label>
              <select
                value={appointmentFormData.doctorId}
                onChange={(e) => handleDoctorSelect(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Choose a doctor...</option>
                {doctorsWithAvailability.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                    ({doctor.availableSlots.length} slots available) - ${doctor.consultationFee}
                  </option>
                ))}
              </select>
            </div>

            {appointmentFormData.doctorId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Time Slots ({availableSlotsForSelectedDoctor.length} available)
                </label>
                <select
                  value={appointmentFormData.availabilitySlotId}
                  onChange={(e) => handleSlotSelect(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Choose a time slot...</option>
                  {availableSlotsForSelectedDoctor.map(slot => {
                    const startDateTime = formatDateTime(slot.startTime);
                    const endDateTime = formatDateTime(slot.endTime);
                    return (
                      <option key={slot.id} value={slot.id}>
                        {startDateTime.date} - {startDateTime.time} to {endDateTime.time}
                        {slot.type && slot.type !== 'standard' && ` (${slot.type})`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Visit</label>
              <textarea
                value={appointmentFormData.reasonForVisit}
                onChange={(e) => setAppointmentFormData(prev => ({ ...prev, reasonForVisit: e.target.value }))
                }
                placeholder="Please describe your reason for the appointment..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleAppointmentSubmit}
                disabled={!appointmentFormData.doctorId || !appointmentFormData.availabilitySlotId || !appointmentFormData.reasonForVisit}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Schedule Appointment
              </button>
              <button
                onClick={() => setShowAppointmentForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );

  });

  const handleViewPrescription = async (prescriptionName: string) => {
    if (!isAuthenticated) return;
    
    try {
      // Use the authenticated question API to get prescription info
      const response = await askQuestionAuthenticated(`who prescribed ${prescriptionName}`);
      
      const infoMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
        escalate: response.escalate,
        reasoning: response.reasoning,
      };
      setMessages(prev => [...prev, infoMessage]);
    } catch (err) {
      console.error('Failed to get prescription info:', err);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `❌ **Error Getting Prescription Info**\n\nI couldn't retrieve information about "${prescriptionName}" right now. Please try again later.`,
        timestamp: new Date(),
        escalate: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleQuickMedicineSearch = () => {
    setShowMedicineSearch(true);
    // Optionally focus on the medicine search input
    setTimeout(() => {
      const searchInput = document.querySelector('[placeholder*="Search medicines"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Health Assistant</h3>
            {isAuthenticated && (
              <span className="text-xs bg-green-500 px-2 py-1 rounded-full flex items-center">
                <UserCheck className="w-3 h-3 mr-1" />
                Logged In
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            {!isAuthenticated && (
              <button
                onClick={handleLogin}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-full text-xs font-medium transition-colors flex items-center"
              >
                <LogIn className="w-3 h-3 mr-1" />
                Login
              </button>
            )}
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setShowAppointmentForm(!showAppointmentForm)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-full text-xs font-medium transition-colors flex items-center"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  Schedule ({doctorsWithAvailability.length})
                </button>
              </>
            )}
            <button
              onClick={() => setIsEmergencyMode(!isEmergencyMode)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isEmergencyMode
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
            >
              {isEmergencyMode ? '🚨 Emergency' : 'Emergency'}
            </button>
          </div>
        </div>
        {isEmergencyMode && (
          <div className="mt-2 text-red-100 text-sm">
            <Phone className="w-4 h-4 inline mr-1" />
            Emergency mode active. For immediate emergencies, call 911/112.
          </div>
        )}
      </div>

      {/* Messages - removed Quick Actions section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200'
                  }`}
              >
                <div className="flex items-start space-x-2">
                  {message.type === 'bot' && <Bot className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />}
                  {message.type === 'user' && <User className="w-5 h-5 mt-0.5" />}
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap">{message.content}</div>

                    {/* Bot message metadata */}
                    {message.type === 'bot' && (
                      <div className="mt-2 space-y-1">
                        {/* Escalation warning */}
                        {message.escalate && (
                          <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Professional consultation recommended</span>
                          </div>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Sources: {message.sources.join(', ')}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Prompt */}
            {message.showLoginPrompt && (
              <div className="ml-8">
                <LoginPrompt onLogin={handleLogin} onClose={handleCloseLoginPrompt} />
              </div>
            )}

            {/* Prescription Display */}
            {message.showPrescriptions && userPrescriptions.length > 0 && (
              <div className="ml-8 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  <Pill className="w-4 h-4 mr-2" />
                  Your Prescriptions ({userPrescriptions.length})
                </h4>
                {userPrescriptions.map((prescription) => (
                  <PrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                    onGetInfo={handleMedicineInfo}
                    onGetSideEffects={handleMedicineSideEffects}
                    onGetUsage={handleMedicineUsage}
                    onViewPrescription={handleViewPrescription}  // Add this line
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}

            {/* Medicine Search */}
            {message.showMedicineSearch && (
              <div className="ml-8">
                <MedicineSearch
                  onSearch={handleMedicineSearch}
                  suggestions={medicineSearchResults}
                  onSuggestionSelect={handleMedicineSelect}
                  isLoading={isLoading}
                />
              </div>
            )}

            {/* Appointment Form */}
            {message.showAppointmentForm && (
              <div className="ml-8">
                <AppointmentForm />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Standalone Forms */}
        {showAppointmentForm && (
          <div className="mx-4">
            <AppointmentForm />
          </div>
        )}

        {showMedicineSearch && (
          <div className="mx-4">
            <MedicineSearch
              onSearch={handleMedicineSearch}
              suggestions={medicineSearchResults}
              onSuggestionSelect={handleMedicineSelect}
              isLoading={isLoading}
            />
          </div>
        )}

        {showLoginPrompt && (
          <div className="mx-4">
            <LoginPrompt onLogin={handleLogin} onClose={handleCloseLoginPrompt} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-slate-600">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isEmergencyMode
                ? "Describe your emergency situation..."
                : isAuthenticated
                  ? "Ask about health, medications, or type 'my appointments' to view your schedule..."
                  : "Ask about medications, symptoms, or health guidance..."
            }
            className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className={`px-4 py-2 rounded-lg transition-colors ${isEmergencyMode
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          💡 This is for informational purposes only. Always consult healthcare professionals for medical decisions.
          {!isAuthenticated && " Log in to access appointment features."}
        </div>
      </form>
    </div>
  );
};
