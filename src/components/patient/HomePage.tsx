import { useMemo } from 'react';
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
import { usePrescriptions } from '@/hooks/usePrescriptions'; // <-- FIXED
import { usePharmacyOrders } from '@/hooks/usePharmacy';
import { useAllAvailabilitySlots } from '@/hooks/useAvailability';
import type { Prescription } from '@/api/prescription';

export default function PatientHomePage() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();

  const { data: appointments = [] } = usePatientAppointments();
  const { data: prescriptions = [] } = usePrescriptions(); // <-- FIXED
  const { data: allOrders = [] } = usePharmacyOrders();
  const { data: availabilitySlots = [] } = useAllAvailabilitySlots();

  // Filter orders for current patient
  const orders = useMemo(() => {
    if (!currentUser || !allOrders) return [];
    return allOrders.filter(order =>
      order.prescription?.patient?.user?.id === currentUser.id
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
      ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status)
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
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
    } else if (isToday(appointmentDate)) {
      return { label: 'Today', color: 'bg-blue-100 text-blue-800' };
    } else if (isTomorrow(appointmentDate)) {
      return { label: 'Tomorrow', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Upcoming', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-purple-100 text-purple-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div className="bg-blue-600 text-white px-6 py-3">
          <div className="max-w-6xl mx-auto">
            {notifications.map((notif, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {notif.type === 'urgent' ? (
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  ) : (
                    <BellIcon className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">{notif.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700"
                  onClick={notif.action}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {currentUser?.profile?.user?.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Here's an overview of your health journey
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.appointmentsThisMonth}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Appointments
                  </p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pending Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    In Progress
                  </p>
                </div>
                <TruckIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Prescriptions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPrescriptions}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    All Time
                  </p>
                </div>
                <DocumentTextIcon className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Available Doctors
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.availableDoctors}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This Week
                  </p>
                </div>
                <UserIcon className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Upcoming Appointments
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/dashboard/patient/appointments' })}
                >
                  View All
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No upcoming appointments
                  </p>
                  <Button
                    onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => {
                    const status = getAppointmentStatus(appointment);
                    const appointmentDate = new Date(appointment.startTime);

                    return (
                      <div key={appointment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {appointment.doctor?.user?.firstName?.[0]}{appointment.doctor?.user?.lastName?.[0]}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {appointment.doctor?.specialization}
                              </p>
                            </div>
                          </div>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {format(appointmentDate, 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {format(appointmentDate, 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Prescriptions */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Recent Prescriptions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/dashboard/patient/prescriptions' })}
                >
                  View All
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentPrescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No prescriptions yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPrescriptions.map((prescription: Prescription) => (
                    <div key={prescription.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {prescription.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(prescription.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Prescribed by: Dr. {prescription.prescribedBy?.user?.firstName} {prescription.prescribedBy?.user?.lastName}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {prescription.medications?.length || 0} medication{prescription.medications?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TruckIcon className="w-5 h-5" />
                  Recent Orders
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: '/dashboard/patient/orders' })}
                >
                  View All
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <TruckIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No orders yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Order #{order.id.slice(-8)}
                        </h4>
                        <Badge className={getOrderStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className="font-medium text-green-600">
                          Ksh {order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
                >
                  <CalendarIcon className="w-4 h-4 mr-3" />
                  Book New Appointment
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: '/dashboard/patient/prescriptions' })}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-3" />
                  View Prescriptions
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: '/dashboard/patient/orders' })}
                >
                  <TruckIcon className="w-4 h-4 mr-3" />
                  Track Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate({ to: '/dashboard/patient/settings' })}
                >
                  <UserIcon className="w-4 h-4 mr-3" />
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Quick Book Button */}
        <div className="md:hidden fixed bottom-6 right-6">
          <Button
            onClick={() => navigate({ to: '/dashboard/patient/book-appointment' })}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
          >
            <PlusIcon className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}