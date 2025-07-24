import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  TruckIcon,
  UserIcon,
  PlusIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { format, isToday, isTomorrow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useAuth';
import { usePatientAppointments } from '@/hooks/useAppointments';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import { usePharmacyOrders } from '@/hooks/usePharmacy';
import { useAllAvailabilitySlots } from '@/hooks/useAvailability';
import type { Prescription } from '@/api/prescription';
import { HealthBotChat } from '@/components/Healthbot/HealthBotChat';
import CreatePatientProfileModal from './profile/CreateProfile';

export default function PatientHomePage() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading } = useCurrentUser();

  const { data: appointments = [] } = usePatientAppointments();
  const { data: prescriptions = [] } = usePrescriptions();
  const { data: allOrders = [] } = usePharmacyOrders();
  const { data: availabilitySlots = [] } = useAllAvailabilitySlots();

  // Filter orders for current patient
  const orders = useMemo(() => {
    if (!currentUser || !allOrders) return [];
    return allOrders.filter(order =>
      order.prescription?.patient.id === currentUser.profile?.id
    );
  }, [allOrders, currentUser]);

  // Get upcoming appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(apt => new Date(apt.startTime) > now && apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 3);
  }, [appointments]);

  // Get recent prescriptions
  const recentPrescriptions = useMemo(() => {
    return prescriptions
      .sort((a: Prescription, b: Prescription) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [prescriptions]);

  // Get recent orders
  const recentOrders = useMemo(() => {
    return orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [orders]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate.getMonth() === now.getMonth() &&
        aptDate.getFullYear() === now.getFullYear();
    }).length;

    const pendingOrders = orders.filter(order =>
      ['pending', 'confirmed', 'processing'].includes(order.status)
    ).length;

    const availableDoctors = new Set(
      availabilitySlots
        .filter(slot => !slot.isBooked && new Date(slot.startTime) > now)
        .map(slot => slot.doctor.id)
    ).size;

    return {
      appointmentsThisMonth: thisMonth,
      pendingOrders,
      availableDoctors,
      totalPrescriptions: prescriptions.length
    };
  }, [appointments, orders, prescriptions, availabilitySlots]);

  // Check for urgent notifications
  const notifications = useMemo(() => {
    const notifs = [];

    // Check for appointments today
    const todayAppointments = upcomingAppointments.filter(apt =>
      isToday(new Date(apt.startTime))
    );
    if (todayAppointments.length > 0) {
      notifs.push({
        type: 'urgent',
        message: `You have ${todayAppointments.length} appointment${todayAppointments.length > 1 ? 's' : ''} today`,
        action: () => navigate({ to: '/dashboard/patient/appointments' })
      });
    }

    // Check for appointments tomorrow
    const tomorrowAppointments = upcomingAppointments.filter(apt =>
      isTomorrow(new Date(apt.startTime))
    );
    if (tomorrowAppointments.length > 0) {
      notifs.push({
        type: 'info',
        message: `Reminder: ${tomorrowAppointments.length} appointment${tomorrowAppointments.length > 1 ? 's' : ''} tomorrow`,
        action: () => navigate({ to: '/dashboard/patient/appointments' })
      });
    }

    return notifs;
  }, [upcomingAppointments, navigate]);

  const getAppointmentStatus = (appointment: any) => {
    const appointmentDate = new Date(appointment.startTime);

    if (appointment.status === 'cancelled') {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
    } else if (isToday(appointmentDate)) {
      return { label: 'Today', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' };
    } else if (isTomorrow(appointmentDate)) {
      return { label: 'Tomorrow', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
    } else {
      return { label: 'Upcoming', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'processing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Add state for HealthBot modal
  const [showHealthBot, setShowHealthBot] = useState(false);

  // Profile creation modal state
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Check if user needs to create a profile
    if (currentUser && (!currentUser.profile || Object.keys(currentUser.profile).length === 0)) {
      setShowProfileModal(true);
    }
  }, [currentUser]);

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Floating HealthBot Button - Enhanced for mobile */}
      <button
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-50 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl transition-all duration-200 active:scale-95"
        onClick={() => setShowHealthBot(true)}
        aria-label="Open HealthBot"
      >
        🤖
      </button>

      {/* HealthBot Modal Overlay - Enhanced for mobile */}
      {showHealthBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
          <div className="relative w-full max-w-md mx-auto">
            <button
              className="absolute top-2 right-2 z-10 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setShowHealthBot(false)}
              aria-label="Close HealthBot"
            >
              <span className="text-lg font-bold text-gray-600 dark:text-gray-300">&times;</span>
            </button>
            <HealthBotChat className="shadow-2xl rounded-lg overflow-hidden" />
          </div>
        </div>
      )}

      {/* Notifications Banner - Enhanced for mobile */}
      {notifications.length > 0 && (
        <div className="bg-blue-600 text-white px-3 sm:px-6 py-2 sm:py-3">
          <div className="max-w-6xl mx-auto">
            {notifications.map((notif, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  {notif.type === 'urgent' ? (
                    <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  ) : (
                    <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">{notif.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700 self-start sm:self-center text-xs sm:text-sm"
                  onClick={notif.action}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header - Enhanced for mobile */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                Welcome back, {currentUser?.profile?.user?.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                Here's an overview of your health journey
              </p>
            </div>
            <div className="flex sm:hidden">
              <Button
                onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                size="sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Button
                onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Enhanced grid for mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    This Month
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.appointmentsThisMonth}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Appointments
                  </p>
                </div>
                <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Pending Orders
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    In Progress
                  </p>
                </div>
                <TruckIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Total Prescriptions
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPrescriptions}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    All Time
                  </p>
                </div>
                <DocumentTextIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Available Doctors
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.availableDoctors}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    This Week
                  </p>
                </div>
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-indigo-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid - Responsive layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Upcoming Appointments - Enhanced for mobile */}
          <Card className="bg-white dark:bg-slate-800 xl:col-span-1">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Upcoming Appointments
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/dashboard/patient/appointments' })}
                  className="self-start sm:self-center text-xs sm:text-sm"
                >
                  View All
                  <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
                    No upcoming appointments
                  </p>
                  <Button
                    onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {upcomingAppointments.map((appointment) => {
                    const status = getAppointmentStatus(appointment);
                    const appointmentDate = new Date(appointment.startTime);

                    return (
                      <div key={appointment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                              {appointment.doctor?.user?.firstName?.[0]}{appointment.doctor?.user?.lastName?.[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {appointment.doctor?.specialization}
                              </p>
                            </div>
                          </div>
                          <Badge className={`${status.color} text-xs sm:text-sm flex-shrink-0`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{format(appointmentDate, 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{format(appointmentDate, 'h:mm a')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Prescriptions - Enhanced for mobile */}
          <Card className="bg-white dark:bg-slate-800 xl:col-span-1">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Recent Prescriptions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/dashboard/patient/prescriptions' })}
                  className="self-start sm:self-center text-xs sm:text-sm"
                >
                  View All
                  <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentPrescriptions.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <DocumentTextIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    No prescriptions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentPrescriptions.map((prescription: Prescription) => (
                    <div key={prescription.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2 flex-1">
                          {prescription.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {format(new Date(prescription.date), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        Prescribed by: Dr. {prescription.prescribedBy?.user?.firstName} {prescription.prescribedBy?.user?.lastName}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                          {prescription.medications?.length || 0} medication{prescription.medications?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders - Enhanced for mobile */}
          <Card className="bg-white dark:bg-slate-800 xl:col-span-1">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                  <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Recent Orders
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/dashboard/patient/orders' })}
                  className="self-start sm:self-center text-xs sm:text-sm"
                >
                  View All
                  <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {recentOrders.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <TruckIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                    No orders yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate flex-1">
                          Order #{order.id.slice(-8)}
                        </h4>
                        <Badge className={`${getOrderStatusColor(order.status)} text-xs flex-shrink-0`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          Ksh {order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions - Enhanced for mobile */}
          <Card className="bg-white dark:bg-slate-800 xl:col-span-1">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-sm sm:text-base lg:text-lg">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 sm:gap-3">
                <Button
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                  onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
                  size="sm"
                >
                  <CalendarIcon className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">Book New Appointment</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={() => navigate({ to: '/dashboard/patient/prescriptions' })}
                  size="sm"
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">View Prescriptions</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={() => navigate({ to: '/dashboard/patient/orders' })}
                  size="sm"
                >
                  <TruckIcon className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">Track Orders</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={() => navigate({ to: '/dashboard/patient/settings' })}
                  size="sm"
                >
                  <UserIcon className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">Update Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Fixed Action Button - Enhanced positioning */}
        <div className="md:hidden fixed bottom-16 right-4 sm:bottom-20 sm:right-6 z-40">
          <Button
            onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg transition-all duration-200 active:scale-95"
            size="sm"
          >
            <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>

        {/* Profile creation modal */}
        <CreatePatientProfileModal 
          isOpen={showProfileModal} 
          onClose={closeProfileModal} 
        />
      </div>
    </div>
  );
}