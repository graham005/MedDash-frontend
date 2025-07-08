import React, { useState, useMemo } from 'react';
import { 
  usePatientAppointments, 
  useCancelAppointment 
} from '@/hooks/useAppointments';
import { useAllAvailabilitySlots } from '@/hooks/useAvailability';
import { useCurrentUser } from '@/hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoCameraIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import type { CreateAppointmentDto } from '@/api/appointments';

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
  licenceNumber: string;
}

export default function AppointmentPage() {
  const {
    data: patientAppointments,
    isLoading: isLoadingPatientAppointments,
    error: patientAppointmentsError,
  } = usePatientAppointments();

  const {
    mutate: cancelAppointment,
    isPending: isCancellingAppointment,
  } = useCancelAppointment();

  const {
    data: availabilitySlots,
    isLoading: isLoadingAvailability,
    error: availabilityError,
  } = useAllAvailabilitySlots();

  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();

  // Extract unique doctors from availability slots for stats
  const availableDoctors = useMemo(() => {
    if (!availabilitySlots) return [];
    
    const doctorMap = new Map();
    availabilitySlots.forEach(slot => {
      if (slot.doctor && !doctorMap.has(slot.doctor.id)) {
        doctorMap.set(slot.doctor.id, {
          id: slot.doctor.id,
          user: slot.doctor.user,
          specialization: slot.doctor.specialization || 'General Medicine',
          qualification: slot.doctor.qualification || 'MD',
          licenceNumber: slot.doctor.licenceNumber || '',
        });
      }
    });
    
    return Array.from(doctorMap.values());
  }, [availabilitySlots]);

  // Separate appointments into upcoming and past
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    if (!patientAppointments) return { upcomingAppointments: [], pastAppointments: [] };
    
    const now = new Date();
    const upcoming = patientAppointments.filter(apt => new Date(apt.startTime) > now);
    const past = patientAppointments.filter(apt => new Date(apt.startTime) <= now);
    
    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [patientAppointments]);

  const getAppointmentStatus = (appointment: any) => {
    const appointmentDate = new Date(appointment.startTime);
    
    if (appointment.status === 'cancelled') {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
    } else if (appointment.status === 'completed') {
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    } else if (isToday(appointmentDate)) {
      return { label: 'Today', color: 'bg-blue-100 text-blue-800' };
    } else if (isTomorrow(appointmentDate)) {
      return { label: 'Tomorrow', color: 'bg-green-100 text-green-800' };
    } else if (appointment.status === 'booked') {
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Confirmed', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId);
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const handleBookAppointment = () => {
    navigate({ to: '/dashboard/patient/book-appointment' });
  };

  const getDoctorInitials = (doctor: Doctor | undefined) => {
    if (!doctor || !doctor.user) return '';
    return `${doctor.user.firstName[0] ?? ''}${doctor.user.lastName[0] ?? ''}`;
  };

  // Calculate available slots count
  const availableSlotsCount = useMemo(() => {
    if (!availabilitySlots) return 0;
    return availabilitySlots.filter(slot => 
      !slot.isBooked && 
      new Date(slot.startTime) > new Date()
    ).length;
  }, [availabilitySlots]);

  if (isLoadingPatientAppointments || isLoadingAvailability) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
    {/* Header Alert */}
    <div className="bg-indigo-700 text-white px-6 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <ExclamationTriangleIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Appointment Tomorrow!</span>
      </div>
    </div>

    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Your Appointments Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Appointments</h2>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upcoming</h3>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                  const status = getAppointmentStatus(appointment);
                  const appointmentDate = new Date(appointment.startTime);
                  
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
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {isToday(appointmentDate) && appointment.status !== 'cancelled' && (
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <VideoCameraIcon className="w-4 h-4" />
                            Join Call
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

      {/* Book New Appointment Section - Simplified */}
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

      {/* Past Appointments Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-400 dark:border-0 dark:bg-slate-800">
        <div className="px-6 py-4 border-b border-gray-400">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Past Appointments</h2>
        </div>

        <div className="p-6">
          {pastAppointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-500 dark:text-white">No past appointments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-400 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-400 dark:text-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {getDoctorInitials(appointment.doctor)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Dr. {appointment.doctor?.user?.firstName ?? 'Unknown'} {appointment.doctor?.user?.lastName ?? ''}
                      </h4>
                      <p className="text-sm text-gray-600">{appointment.doctor?.specialization ?? ''}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(appointment.startTime), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
                    <EyeIcon className="w-4 h-4" />
                    View Notes
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Book Floating Action Button */}
      <button 
        onClick={handleBookAppointment}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center group"
      >
        <PlusIcon className="w-6 h-6" />
        <span className="sr-only">Quick Book</span>
        
        {/* Tooltip */}
        <div className="absolute right-16 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Quick Book
        </div>
      </button>
    </div>
  </div>
  );
}