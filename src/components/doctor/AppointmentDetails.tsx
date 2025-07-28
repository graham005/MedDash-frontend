import { useState } from 'react';
import { format, parseISO, isAfter } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  UserIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDoctorAppointmentById, useUpdateAppointmentStatus } from '@/hooks/useAppointments';
import { useNavigate } from '@tanstack/react-router';
import MessagingModal from '@/components/messaging/MessagingModal';

interface AppointmentDetailsProps {
  appointmentId: string;
}

export default function AppointmentDetails({ appointmentId }: AppointmentDetailsProps) {
  const navigate = useNavigate();
  const { data: appointment, isLoading, error } = useDoctorAppointmentById(appointmentId);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateAppointmentStatus();

  // Messaging modal state
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Appointment not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The appointment you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate({ to: '/dashboard/doctor/appointments' })}>
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  const now = new Date();

  // Check if appointment is cancelled or end time has passed
  const isCancelled = appointment.status === 'cancelled';
  const isExpired = isAfter(now, endTime);
  const shouldShowMeetingUrl = appointment.availabilitySlot?.type === 'consultation' && !isCancelled && !isExpired;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getAvailabilityTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'in-person':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'emergency':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getAvailabilityTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <VideoCameraIcon className="w-4 h-4" />;
      case 'in-person':
        return <UserIcon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    updateStatus({
      id: appointmentId,
      status: newStatus as 'booked' | 'confirmed' | 'cancelled' | 'completed'
    });
  };

  const getPatientInitials = () => {
    const firstName = appointment.patient?.user?.firstName || '';
    const lastName = appointment.patient?.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleOpenMessaging = () => {
    setIsMessagingOpen(true);
  };

  // Generate meeting URL for consultations (you can customize this logic)
  const generateMeetingUrl = () => {
    // This could be integrated with your video calling service (Zoom, Teams, etc.)
    return `https://meet.meddash.com/room/${appointmentId}`;
  };

  const handleJoinMeeting = () => {
    if (shouldShowMeetingUrl) {
      const meetingUrl = appointment.meetingUrl || generateMeetingUrl();
      window.open(meetingUrl, '_blank');
    }
  };

  const handleCopyMeetingUrl = () => {
    if (shouldShowMeetingUrl) {
      const meetingUrl = appointment.meetingUrl || generateMeetingUrl();
      navigator.clipboard.writeText(meetingUrl);
      // You might want to add a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Messaging Modal */}
      <MessagingModal
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
        context="appointment"
        conversationId={appointmentId}
        participantName={`${appointment.patient?.user?.firstName} ${appointment.patient?.user?.lastName}`}
        participantRole="patient"
        appointmentDetails={{
          startTime,
          endTime,
          status: appointment.status || 'booked',
          reasonForVisit: appointment.reasonForVisit || ''
        }}
        receiverId={appointment.patient.user.id}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/dashboard/doctor/appointments' })}
            className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Appointments
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Appointment Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {format(startTime, 'EEEE, MMMM d, yyyy')} at {format(startTime, 'h:mm a')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Badge className={cn('text-sm font-medium px-3 py-1', getStatusColor(appointment.status || 'booked'))}>
                {appointment.status || 'booked'}
              </Badge>
              {appointment.availabilitySlot?.type && (
                <Badge className={cn('text-sm font-medium px-3 py-1 flex items-center gap-1', 
                  getAvailabilityTypeColor(appointment.availabilitySlot.type))}>
                  {getAvailabilityTypeIcon(appointment.availabilitySlot.type)}
                  {appointment.availabilitySlot.type === 'consultation' ? 'Video Consultation' : 
                   appointment.availabilitySlot.type === 'standard' ? 'In-Person Visit' : 
                   appointment.availabilitySlot.type}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Consultation Banner - Only show if conditions are met */}
            {shouldShowMeetingUrl && (
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                        <VideoCameraIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                          Video Consultation
                        </h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Meeting URL: {appointment.meetingUrl || generateMeetingUrl()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCopyMeetingUrl}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-800"
                      >
                        <LinkIcon className="w-4 h-4 mr-1" />
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleJoinMeeting}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <VideoCameraIcon className="w-4 h-4 mr-1" />
                        Join Meeting
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expired/Cancelled Consultation Notice */}
            {appointment.availabilitySlot?.type === 'consultation' && !shouldShowMeetingUrl && (
              <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-500 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <VideoCameraIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                        Video Consultation
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isCancelled 
                          ? 'This appointment has been cancelled' 
                          : 'This appointment has expired'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Patient Card */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {getPatientInitials()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Patient ID: #{appointment.patient?.user?.id?.slice(-8)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <EnvelopeIcon className="w-5 h-5 mr-3" />
                    <span>{appointment.patient?.user?.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <PhoneIcon className="w-5 h-5 mr-3" />
                    <span>{appointment.patient?.user?.phoneNumber || 'No phone provided'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Details */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Appointment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <CalendarIcon className="w-5 h-5 mr-3" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm">{format(startTime, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <ClockIcon className="w-5 h-5 mr-3" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm">{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Type */}
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  {getAvailabilityTypeIcon(appointment.availabilitySlot?.type || 'in-person')}
                  <div className="ml-3">
                    <p className="font-medium">Appointment Type</p>
                    <p className="text-sm">
                      {appointment.availabilitySlot?.type === 'consultation' ? 'Video Consultation' : 
                       appointment.availabilitySlot?.type === 'in-person' ? 'In-Person Visit' : 
                       appointment.availabilitySlot?.type || 'In-Person Visit'}
                    </p>
                  </div>
                </div>

                {appointment.reasonForVisit && (
                  <div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                      <DocumentTextIcon className="w-5 h-5 mr-3" />
                      <p className="font-medium">Reason for Visit</p>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                      {appointment.reasonForVisit}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* If appointment is expired, only show message patient */}
                {isExpired ? (
                  <Button
                    onClick={handleOpenMessaging}
                    variant="outline"
                    className="w-full border-gray-300 dark:border-slate-600"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                    Message Patient
                  </Button>
                ) : (
                  <>
                    {/* Video consultation specific actions - Only show if conditions are met */}
                    {shouldShowMeetingUrl && (
                      <>
                        <Button
                          onClick={handleJoinMeeting}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <VideoCameraIcon className="w-4 h-4 mr-2" />
                          Join Video Call
                        </Button>
                        <Button
                          onClick={handleCopyMeetingUrl}
                          variant="outline"
                          className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/20"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Copy Meeting URL
                        </Button>
                      </>
                    )}

                    {appointment.status === 'booked' && (
                      <Button
                        onClick={() => handleStatusUpdate('confirmed')}
                        disabled={isUpdatingStatus}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Confirm Appointment
                      </Button>
                    )}

                    {(appointment.status === 'booked' || appointment.status === 'confirmed') && (
                      <Button
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={isUpdatingStatus}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Mark as Completed
                      </Button>
                    )}

                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <Button
                        onClick={() => handleStatusUpdate('cancelled')}
                        disabled={isUpdatingStatus}
                        variant="destructive"
                        className="w-full"
                      >
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Cancel Appointment
                      </Button>
                    )}

                    <Button
                      onClick={handleOpenMessaging}
                      variant="outline"
                      className="w-full border-gray-300 dark:border-slate-600"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                      Message Patient
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Appointment History */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Patient History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Previous appointments with this patient
                </p>
                <div className="space-y-2">
                  <div className="text-sm bg-gray-50 dark:bg-slate-700 p-2 rounded">
                    <p className="font-medium">No previous appointments</p>
                    <p className="text-gray-500 dark:text-gray-400">This is a new patient</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}