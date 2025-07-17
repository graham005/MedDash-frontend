import { useState, useMemo, useEffect } from 'react';
import { format, addDays, isSameDay, isAfter, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, User, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAllAvailabilitySlots } from '@/hooks/useAvailability';
import { useCurrentUser } from '@/hooks/useAuth';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { useInitializePayment, useVerifyPayment } from '@/hooks/usePayments';
import type { AvailabilitySlot } from '@/api/availability';
import type { CreateAppointmentDto } from '@/api/appointments';
import { toast } from 'sonner';

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
  consultationFee: number;
}

interface BookAppointmentProps {
  className?: string;
}

export default function BookAppointment({ className }: BookAppointmentProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailabilitySlot | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [currentDoctorIndex, setCurrentDoctorIndex] = useState(0);
  const [step, setStep] = useState<'doctor' | 'datetime' | 'details' | 'confirm'>('doctor');

  const { data: currentUser } = useCurrentUser();
  const {
    mutate: createAppointment,
    isPending: isCreatingAppointment,
    error: createAppointmentError,
  } = useCreateAppointment();
  const { data: allAvailabilitySlots = [], isLoading: isLoadingSlots } = useAllAvailabilitySlots();
  const initializePayment = useInitializePayment();
  const verifyPayment = useVerifyPayment();

  // Only show doctors who have at least one available slot
  const doctors = useMemo(() => {
    const doctorMap = new Map<string, Doctor>();
    allAvailabilitySlots.forEach(slot => {
      console.log(slot.type)
      if (!slot.isBooked) {
        doctorMap.set(slot.doctor.id, slot.doctor);
      }
    });
    return Array.from(doctorMap.values());
  }, [allAvailabilitySlots]);

  // Get available time slots for selected doctor and date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];
    return allAvailabilitySlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      const slotDoctor = slot.doctor.id === selectedDoctor.id;
      const slotOnSelectedDate = isSameDay(slotDate, selectedDate);
      const slotInFuture = isAfter(slotDate, new Date());
      return slotDoctor && slotOnSelectedDate && slotInFuture;
    });
  }, [selectedDoctor, selectedDate, allAvailabilitySlots]);

  // Generate next 14 days for date selection
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(addDays(startOfDay(new Date()), i));
    }
    return dates;
  }, []);

  // Reset selections when doctor changes
  useEffect(() => {
    setSelectedTimeSlot(null);
  }, [selectedDoctor, selectedDate]);

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep('datetime');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedTimeSlot(slot);
    setStep('details');
  };

  const handleNextDoctor = () => {
    if (currentDoctorIndex < doctors.length - 3) {
      setCurrentDoctorIndex(currentDoctorIndex + 1);
    }
  };

  const handlePrevDoctor = () => {
    if (currentDoctorIndex > 0) {
      setCurrentDoctorIndex(currentDoctorIndex - 1);
    }
  };

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedTimeSlot || !currentUser) return;

    const appointmentData: CreateAppointmentDto = {
      doctorId: selectedDoctor.id,
      patientId: currentUser?.id,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      availabilitySlotId: selectedTimeSlot.id,
      status: 'booked',
      reasonForVisit
    };


    createAppointment(appointmentData, {
      onSuccess: () => {
        setStep('confirm');
      }
    });
  };

  // Payment state
  const [isPaying, setIsPaying] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    authorizationUrl: string;
    reference: string;
    appointmentId: string;
  } | null>(null);

  // Payment handler for consultation
  const handleConsultationPayment = async () => {
    if (!selectedDoctor || !selectedTimeSlot || !currentUser) return;

    setIsPaying(true);

    // 1. Create the appointment with status 'pending'
    const appointmentData: CreateAppointmentDto = {
      doctorId: selectedDoctor.id,
      patientId: currentUser?.id,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      availabilitySlotId: selectedTimeSlot.id,
      status: 'confirmed',
      reasonForVisit
    };

    createAppointment(appointmentData, {
      onSuccess: async (appointment) => {
        // 2. Initialize payment
        try {
          const paymentResponse = await initializePayment.mutateAsync({
            fullName: `${currentUser.profile?.user?.firstName} ${currentUser.profile?.user?.lastName}`,
            email: currentUser.profile?.user?.email ?? '',
            phoneNumber: currentUser.profile?.user?.phoneNumber || '',
            amount: Number(selectedDoctor.consultationFee),
            type: 'appointment',
            appointmentId: appointment.id,
            notes: `Consultation payment for appointment ${appointment.id}`
          });

          setPaymentModal({
            authorizationUrl: paymentResponse.paystack_data.authorization_url,
            reference: paymentResponse.paystack_data.reference,
            appointmentId: appointment.id
          });
        } catch (err) {
          toast.error('Failed to initialize payment');
        } finally {
          setIsPaying(false);
        }
      },
      onError: () => {
        setIsPaying(false);
      }
    });
  };

  // Handle payment verification after Paystack window closes
  const handleVerifyPayment = async () => {
    if (!paymentModal) return;
    setIsPaying(true);
    try {
      const verification = await verifyPayment.mutateAsync(paymentModal.reference);
      if (verification.status === 'success') {
        // Optionally, update the appointment status to 'confirmed' here if your backend doesn't do it automatically
        toast.success('Payment verified and appointment confirmed!');
        setStep('confirm');
        setPaymentModal(null);
      } else {
        toast.error('Payment verification failed');
      }
    } catch (err) {
      toast.error('Payment verification failed');
    } finally {
      setIsPaying(false);
    }
  };

  // Open Paystack payment page and listen for window close
  useEffect(() => {
    if (paymentModal?.authorizationUrl) {
      const paymentWindow = window.open(
        paymentModal.authorizationUrl,
        '_blank',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      const checkClosed = setInterval(() => {
        if (paymentWindow?.closed) {
          clearInterval(checkClosed);
          setTimeout(() => {
            handleVerifyPayment();
          }, 2000);
        }
      }, 1000);
      return () => clearInterval(checkClosed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentModal?.authorizationUrl]);


  // Reset form to initial state
  const resetForm = () => {
    setSelectedDoctor(null);
    setSelectedDate(new Date());
    setSelectedTimeSlot(null);
    setReasonForVisit('');
    setCurrentDoctorIndex(0);
    setStep('doctor');
    setPaymentModal(null);
    setIsPaying(false);
  };

  return (
    <div className={cn("space-y-6 w-full  mx-auto p-6 dark:bg-slate-950", className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Book an Appointment</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Find and schedule with the right doctor for you</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[
          { key: 'doctor', label: 'Choose Doctor', icon: User },
          { key: 'datetime', label: 'Date & Time', icon: Calendar },
          { key: 'details', label: 'Details', icon: FileText },
          { key: 'confirm', label: 'Confirm', icon: Check }
        ].map((stepItem, index) => {
          const Icon = stepItem.icon;
          const isActive = step === stepItem.key;
          const isCompleted =
            (step === 'datetime' && stepItem.key === 'doctor') ||
            (step === 'details' && ['doctor', 'datetime'].includes(stepItem.key)) ||
            (step === 'confirm' && ['doctor', 'datetime', 'details'].includes(stepItem.key));

          return (
            <div key={stepItem.key} className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2",
                isActive && "bg-indigo-500 border-indigo-500 text-white",
                isCompleted && "bg-green-500 border-green-500 text-white",
                !isActive && !isCompleted && "border-gray-300 text-gray-300"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "ml-2 text-sm font-medium",
                isActive && "text-indigo-600",
                isCompleted && "text-green-600",
                !isActive && !isCompleted && "text-gray-400"
              )}>
                {stepItem.label}
              </span>
              {index < 3 && (
                <div className={cn(
                  "w-12 h-0.5 mx-4",
                  isCompleted && "bg-green-500",
                  !isCompleted && "bg-gray-300"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Choose Doctor */}
      {step === 'doctor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Choose Your Doctor
            </CardTitle>
            <CardDescription>Select from our available healthcare professionals</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter doctors who have at least one future available slot
              const now = new Date();
              const availableDoctors = doctors.filter(doctor =>
                allAvailabilitySlots.some(
                  slot =>
                    slot.doctor.id === doctor.id &&
                    !slot.isBooked &&
                    new Date(slot.startTime) > now
                )
              );

              if (availableDoctors.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    No doctors available at the moment. Please try again later.
                  </div>
                );
              }

              return (
                <div className="relative">
                  {/* Carousel Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevDoctor}
                      disabled={currentDoctorIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {currentDoctorIndex + 1} - {Math.min(currentDoctorIndex + 3, availableDoctors.length)} of {availableDoctors.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextDoctor}
                      disabled={currentDoctorIndex >= availableDoctors.length - 3}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Doctor Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availableDoctors.slice(currentDoctorIndex, currentDoctorIndex + 3).map((doctor) => (
                      <Card
                        key={doctor.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:shadow-lg hover:scale-105 dark:bg-slate-900",
                          selectedDoctor?.id === doctor.id
                        )}
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-4">
                            <img
                              src={`https://randomuser.me/api/portraits/${doctor.id.length % 2 === 0 ? 'women' : 'men'}/${Math.abs(doctor.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 100}.jpg`}
                              alt={`Dr. ${doctor.user.firstName.toUpperCase()} ${doctor.user.lastName.toUpperCase()}`}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                Dr. {doctor.user.firstName} {doctor.user.lastName}
                              </h3>
                              <p className="text-blue-600 dark:text-blue-400 font-medium">
                                {doctor.specialization}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {doctor.qualification}
                              </p>
                              <p className="text-xs text-gray-400">
                                License: {doctor.licenseNumber}
                              </p>
                              <p className='text-sm text-gray-400'>
                                {allAvailabilitySlots.some(
                                  slot =>
                                    slot.doctor.id === doctor.id &&
                                    slot.type === 'consultation'
                                )
                                ? `Consultation Fee: ${doctor.consultationFee}`
                                  : null}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date & Time */}
      {step === 'datetime' && selectedDoctor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Date & Time
            </CardTitle>
            <CardDescription>
              Choose your preferred appointment time with Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Select Date</Label>
              <div className="grid grid-cols-7 gap-2 p-2">
                {availableDates.map((date) => (
                  <Button
                    key={date.toISOString()}
                    variant={isSameDay(date, selectedDate) ? "default" : "outline"}
                    size="sm"
                    className="h-fit flex flex-col items-center justify-center p-2"
                    onClick={() => handleDateSelect(date)}
                  >
                    <span className="text-xs">{format(date, 'EEE')}</span>
                    <span className="text-lg font-semibold">{format(date, 'd')}</span>
                    <span className="text-xs">{format(date, 'MMM')}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Available Times for {format(selectedDate, 'EEEE, MMMM d')}
              </Label>
              {availableTimeSlots.filter(slot => new Date(slot.startTime) > new Date()).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available time slots for this date. Please select another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {availableTimeSlots
                    .filter(slot => new Date(slot.startTime) > new Date())
                    .map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedTimeSlot?.id === slot.id ? "default" : "outline"}
                        size="sm"
                        className="h-fit p-2 flex flex-col items-center justify-center"
                        onClick={() => !slot.isBooked && handleTimeSlotSelect(slot)}
                        disabled={slot.isBooked}
                      >
                        <Clock className="w-4 h-4 mb-1" />
                        <span className="text-xs font-medium">
                          {format(new Date(slot.startTime), 'HH:mm')}
                        </span>
                        <span className={cn(
                          "text-xs capitalize",
                          slot.isBooked ? "text-red-500" : "text-gray-500"
                        )}>
                          {slot.type || 'standard'}
                        </span>
                        {slot.isBooked && (
                          <span className="text-[10px] text-red-500 mt-1">Booked</span>
                        )}
                      </Button>
                    ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('doctor')}>
                Back to Doctors
              </Button>
              <Button
                onClick={() => setStep('details')}
                disabled={!selectedTimeSlot}
              >
                Continue to Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Patient Details */}
      {step === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Patient Information
            </CardTitle>
            <CardDescription>Review your information and provide reason for visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={currentUser?.profile?.user?.firstName || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={currentUser?.profile?.user?.lastName || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.profile?.user?.email || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Reason for Visit */}
            <div>
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea
                id="reason"
                placeholder="Please describe your symptoms or reason for this appointment..."
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>

            {/* Appointment Summary */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Appointment Summary</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Doctor:</span> Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}</p>
                <p><span className="font-medium">Specialization:</span> {selectedDoctor?.specialization}</p>
                <p><span className="font-medium">Date:</span> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                <p><span className="font-medium">Time:</span> {selectedTimeSlot ? format(new Date(selectedTimeSlot.startTime), 'HH:mm') : ''} - {selectedTimeSlot ? format(new Date(selectedTimeSlot.endTime), 'HH:mm') : ''}</p>
                <p><span className="font-medium">Type:</span> {selectedTimeSlot?.type}</p>
                {/* Show cost if consultation */}
                {selectedTimeSlot?.type === 'consultation' && (
                  <p>
                    <span className="font-medium">Consultation Fee:</span> {selectedDoctor?.consultationFee}
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {createAppointmentError && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {createAppointmentError.message}
                </p>
              </div>
            )}

            {/* Navigation & Payment */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('datetime')}>
                Back to Date & Time
              </Button>
              <div className="flex gap-2">
                {selectedTimeSlot?.type === 'consultation' ? (
                  <>
                    <Button
                      onClick={handleConsultationPayment}
                      disabled={isPaying || !reasonForVisit.trim()}
                    >
                      {isPaying ? 'Processing Payment...' : `Pay & Book (${selectedDoctor?.consultationFee})`}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleBookAppointment}
                      disabled={isCreatingAppointment || !reasonForVisit.trim()}
                    >
                      {isCreatingAppointment ? 'Booking...' : 'Book Without Payment'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleBookAppointment}
                    disabled={isCreatingAppointment || !reasonForVisit.trim()}
                  >
                    {isCreatingAppointment ? 'Booking...' : 'Book Appointment'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirmation */}
      {step === 'confirm' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              Appointment Booked Successfully!
            </CardTitle>
            <CardDescription>Your appointment has been confirmed</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Appointment Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Doctor:</span> Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}</p>
                <p><span className="font-medium">Date:</span> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                <p><span className="font-medium">Time:</span> {selectedTimeSlot ? format(new Date(selectedTimeSlot.startTime), 'HH:mm') : ''} - {selectedTimeSlot ? format(new Date(selectedTimeSlot.endTime), 'HH:mm') : ''}</p>
                <p><span className="font-medium">Status:</span> Booked</p>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400">
              You will receive a confirmation email shortly. Please arrive 15 minutes before your appointment time.
            </p>

            <Button onClick={resetForm} className="w-full">
              Book Another Appointment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}