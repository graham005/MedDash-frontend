import { useState, useMemo } from 'react';
import {
  usePatientAppointments,
  useCancelAppointment,
  useUpdateAppointment
} from '@/hooks/useAppointments';
import { useAllAvailabilitySlots } from '@/hooks/useAvailability';
import { useNavigate } from '@tanstack/react-router';
import {
  CalendarIcon,
  VideoCameraIcon,
  EyeIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format, isPast } from 'date-fns';
import type { Appointment } from '@/api/appointments';
import { useInitializePayment, useVerifyPayment } from '@/hooks/usePayments';
import { toast } from 'sonner';
import MessagingModal from '@/components/messaging/MessagingModal';

interface Doctor {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  specialization: string;
  qualification: string;
  licenseNumber: string;
}

export default function AppointmentPage() {
  const navigate = useNavigate();
  const { data: appointments = [], isLoading, error } = usePatientAppointments();
  const { data: availabilitySlots = [] } = useAllAvailabilitySlots();
  const { mutate: cancelAppointment, isPending: isCancellingAppointment } = useCancelAppointment();
  const { mutate: updateAppointment } = useUpdateAppointment();

  const [payingAppointment, setPayingAppointment] = useState<null | { appointment: Appointment }>(null);
  const initializePayment = useInitializePayment();
  const verifyPayment = useVerifyPayment();

  // Messaging modal state
  const [messagingModal, setMessagingModal] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  // Calculate available slots count (only slots that are not booked and in the future)
  const availableSlotsCount = useMemo(() => {
    if (!availabilitySlots) return 0;
    return availabilitySlots.filter(slot =>
      !slot.isBooked && // Only show slots that are not booked
      new Date(slot.startTime) > new Date()
    ).length;
  }, [availabilitySlots]);

  // Extract unique doctors from availability slots for stats (only if they have open slots)
  const availableDoctors = useMemo(() => {
    if (!availabilitySlots) return [];

    const now = new Date();
    const doctorMap = new Map();

    availabilitySlots.forEach(slot => {
      // Only consider slots that are not booked and in the future
      if (
        slot.doctor &&
        !slot.isBooked && // Only show slots that are not booked
        new Date(slot.startTime) > now
      ) {
        if (!doctorMap.has(slot.doctor.id)) {
          doctorMap.set(slot.doctor.id, {
            id: slot.doctor.id,
            user: slot.doctor.user,
            specialization: slot.doctor.specialization || 'General Medicine',
            qualification: slot.doctor.qualification || 'MD',
            licenseNumber: slot.doctor.licenseNumber || '',
          });
        }
      }
    });

    return Array.from(doctorMap.values());
  }, [availabilitySlots]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return !isPast(appointmentDate);
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return isPast(appointmentDate);
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [appointments]);

  const getDoctorInitials = (doctor: Doctor | undefined) => {
    if (!doctor || !doctor.user) return '';
    return `${doctor.user.firstName[0].toUpperCase() ?? ''}${doctor.user.lastName[0].toUpperCase() ?? ''}`;
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    const status = appointment.status || 'booked';
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmed', color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
      case 'completed':
        return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
      default:
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  // Payment handler for consultation appointments
  const handlePayNow = async (appointment: Appointment) => {
    setPayingAppointment({ appointment });
    try {
      const paymentResponse = await initializePayment.mutateAsync({
        fullName: `${appointment.patient?.user?.firstName ?? ''} ${appointment.patient?.user?.lastName ?? ''}`,
        email: appointment.patient?.user?.email ?? '',
        phoneNumber: appointment.patient?.user?.phoneNumber ?? '',
        amount: Number(appointment.doctor?.consultationFee ?? 0),
        type: 'appointment',
        appointmentId: appointment.id,
        notes: `Consultation payment for appointment ${appointment.id}`
      });

      // Open Paystack payment page
      const paymentWindow = window.open(
        paymentResponse.paystack_data.authorization_url,
        '_blank',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      const checkClosed = setInterval(async () => {
        if (paymentWindow?.closed) {
          clearInterval(checkClosed);
          setTimeout(async () => {
            try {
              const verification = await verifyPayment.mutateAsync(paymentResponse.paystack_data.reference);
              if (verification.status === 'success') {
                // Update appointment status to confirmed
                updateAppointment(
                  { id: appointment.id, data: { status: 'confirmed', reasonForVisit: appointment.reasonForVisit } },
                  {
                    onSuccess: () => {
                      window.location.reload(); // Refresh to update appointment status
                    },
                    onError: () => {
                      toast.error('Payment succeeded but failed to confirm appointment.');
                    }
                  }
                );
              } else {
                toast.error('Payment verification failed');
              }
            } catch {
              toast.error('Payment verification failed');
            }
          }, 2000);
        }
      }, 1000);
    } catch (err) {
      toast.error('Failed to initialize payment');
    } finally {
      setPayingAppointment(null);
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      cancelAppointment(appointmentId);
    }
  };

  const handleBookAppointment = () => {
    navigate({ to: '/dashboard/patient/book-appointment' });
  };

  const handleOpenMessaging = (appointment: Appointment) => {
    setMessagingModal({ isOpen: true, appointment });
  };

  const handleCloseMessaging = () => {
    setMessagingModal({ isOpen: false, appointment: null });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error loading appointments
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Messaging Modal */}
      {messagingModal.appointment && (
        <MessagingModal
          isOpen={messagingModal.isOpen}
          onClose={handleCloseMessaging}
          context="appointment"
          conversationId={messagingModal.appointment.id}
          participantName={`Dr. ${messagingModal.appointment.doctor?.user.firstName} ${messagingModal.appointment.doctor?.user.lastName}`}
          participantRole="doctor"
          appointmentDetails={{
            startTime: new Date(messagingModal.appointment.startTime),
            endTime: new Date(messagingModal.appointment.endTime),
            status: messagingModal.appointment.status || 'booked',
            reasonForVisit: messagingModal.appointment.reasonForVisit || ''
          }}
          receiverId={messagingModal.appointment.doctor?.user.id} // <-- Add this line
        />
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header and Quick Actions */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Appointments</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Manage your healthcare appointments</p>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Book New</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{availableSlotsCount}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Available slots</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Upcoming</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">{upcomingAppointments.length}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Appointments</p>
                </div>
                <ClockIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Completed</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{pastAppointments.length}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Total visits</p>
                </div>
                <EyeIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
          <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Appointments</h2>
          </div>
          <div className="p-6">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No upcoming appointments</p>
                <button
                  onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
                  className="mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Book your first appointment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const status = getAppointmentStatus(appointment);
                  const appointmentDate = new Date(appointment.startTime);
                  const slotType = appointment.availabilitySlot?.type || 'standard';

                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getDoctorInitials(appointment.doctor)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Dr. {appointment?.doctor?.user.firstName} {appointment.doctor.user.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{appointment.doctor?.specialization ?? ''}</p>
                          <p className="text-sm text-gray-500">
                            {format(appointmentDate, 'MMM d, h:mm a')}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            Type: {slotType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {/* Consultation: Show Join Call if confirmed, else Pay Now */}
                        {slotType === 'consultation'&& appointment.status !== 'cancelled' && (
                          appointment.status === 'confirmed' ? (
                            <a
                              href={appointment.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <VideoCameraIcon className="w-4 h-4" />
                              Join Call
                            </a>
                          ) : (
                            <button
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                              onClick={() => handlePayNow(appointment)}
                              disabled={payingAppointment?.appointment.id === appointment.id}
                            >
                              {payingAppointment?.appointment.id === appointment.id ? 'Processing...' : 'Pay Now'}
                            </button>
                          )
                        )}
                        {/* Message Doctor Button */}
                        { appointment.status !== 'cancelled' && (
                        <button
                          onClick={() => handleOpenMessaging(appointment)}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          Message
                        </button>
                        )}
                        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                          <button
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={isCancellingAppointment}
                            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border dark:border-0 border-gray-200 mb-8 dark:bg-slate-800 ">
          <div className="px-6 py-4 border-b border-gray-400 ">
            <h2 className="text-xl font-semibold dark:text-white text-gray-900">Book New Appointment</h2>
          </div>

          <div className="p-6">
            <div className="text-center py-8">
              {/* Icon */}
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Schedule Your Next Appointment
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Find the perfect time slot with one of our {availableDoctors.length} available doctors.
                We have {availableSlotsCount} time slots available this week.
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{availableDoctors.length}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 ">Available Doctors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{availableSlotsCount}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 ">Open Slots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">5</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 ">Specialties</div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleBookAppointment}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <CalendarIcon className="w-5 h-5" />
                Book Appointment
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Past Appointments */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Past Appointments</h2>
          </div>
          <div className="p-6">
            {pastAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>No past appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastAppointments.slice(0, 5).map((appointment) => {
                  const status = getAppointmentStatus(appointment);
                  const appointmentDate = new Date(appointment.startTime);

                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-75">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getDoctorInitials(appointment.doctor)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Dr. {appointment?.doctor?.user.firstName} {appointment.doctor.user.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{appointment.doctor?.specialization ?? ''}</p>
                          <p className="text-sm text-gray-500">
                            {format(appointmentDate, 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {/* Message Doctor Button for past appointments */}
                        {appointment.status !== 'cancelled' && (
                        <button
                          onClick={() => handleOpenMessaging(appointment)}
                          className="px-4 py-2 border border-gray-400 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          Message
                        </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}