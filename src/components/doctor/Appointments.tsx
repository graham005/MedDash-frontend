import { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import {
    CalendarIcon,
    ClockIcon,
    EyeIcon,
    UserIcon,
    EnvelopeIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDoctorAppointments } from '@/hooks/useAppointments';
import { useNavigate } from '@tanstack/react-router';
import type { Appointment } from '@/api/appointments';

interface AppointmentCardProps {
    appointment: Appointment;
    onViewDetails: (id: string) => void;
}

function AppointmentCard({ appointment, onViewDetails }: AppointmentCardProps) {
    const startTime = parseISO(appointment.startTime);
    const endTime = parseISO(appointment.endTime);

    // Generate patient initials
    const getPatientInitials = (appointment: Appointment) => {
        const firstName = appointment.patient?.user?.firstName || '';
        const lastName = appointment.patient?.user?.lastName || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Get status badge color
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

    // Get availability status
    const getAvailabilityStatus = () => {
        if (isPast(startTime)) {
            return { text: 'Past appointment', color: 'text-gray-500 dark:text-gray-400' };
        } else if (isToday(startTime)) {
            return { text: 'Today', color: 'text-green-600 dark:text-green-400' };
        } else if (isTomorrow(startTime)) {
            return { text: 'Tomorrow', color: 'text-blue-600 dark:text-blue-400' };
        } else {
            return { text: format(startTime, 'MMM d'), color: 'text-gray-600 dark:text-gray-300' };
        }
    };

    const availabilityStatus = getAvailabilityStatus();
    
    return (
        <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:scale-[1.01]">
            <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Patient Avatar */}
                <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {getPatientInitials(appointment)}
                </div>
                </div>
                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {appointment.patient?.user?.firstName || 'Unknown'} {appointment.patient?.user?.lastName || ''}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {appointment.availabilitySlot.type || 'General consultation'}
                    </p>
                    </div>
                    <Badge className={cn('text-xs font-medium px-2 py-1', getStatusColor(appointment.status || 'booked'))}>
                    {appointment.status || 'booked'}
                    </Badge>
                </div>
                </div>
            </div>
            <div className='pl-5'>
                {/* Patient Contact Info */}
                <div className="space-y-1 mb-4 text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <EnvelopeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{appointment.patient?.user?.email || 'No email'}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <UserIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>ID: #{appointment.patient?.id?.slice(-8) || 'Unknown'}</span>
                </div>
                </div>

                {/* Appointment Time and Availability */}
                <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">
                    {format(startTime, 'EEEE, MMMM d, yyyy')}
                    </span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">
                    {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                    </span>
                </div>
                <div className="flex items-center">
                    <div className={cn("w-2 h-2 rounded-full mr-2",
                    availabilityStatus.color.includes('green') ? 'bg-green-500' :
                        availabilityStatus.color.includes('blue') ? 'bg-blue-500' : 'bg-gray-400'
                    )} />
                    <span className={cn("text-sm font-medium", availabilityStatus.color)}>
                    {availabilityStatus.text}
                    </span>
                </div>
                </div>

                {/* Action Button */}
                <Button
                onClick={() => onViewDetails(appointment.id)}
                className="w-full sm:w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
                size="sm"
                >
                <EyeIcon className="w-4 h-4 mr-2" />
                View Details
                </Button>
            </div>
            </CardContent>
        </Card>
    );
}

export default function DoctorAppointments() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');

    const { data: appointments = [], isLoading, error } = useDoctorAppointments();
    const navigate = useNavigate();

    // Filter appointments based on search and filters
    const filteredAppointments = useMemo(() => {
        return appointments.filter(appointment => {
            const matchesSearch = searchQuery === '' ||
                `${appointment.patient?.user?.firstName} ${appointment.patient?.user?.lastName}`
                    .toLowerCase().includes(searchQuery.toLowerCase()) ||
                appointment.reasonForVisit?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

            const appointmentDate = parseISO(appointment.startTime);
            const matchesDate = dateFilter === 'all' ||
                (dateFilter === 'today' && isToday(appointmentDate)) ||
                (dateFilter === 'tomorrow' && isTomorrow(appointmentDate)) ||
                (dateFilter === 'past' && isPast(appointmentDate)) ||
                (dateFilter === 'upcoming' && !isPast(appointmentDate));

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [appointments, searchQuery, statusFilter, dateFilter]);

    // Group appointments by date
    const groupedAppointments = useMemo(() => {
        const groups: { [key: string]: Appointment[] } = {};

        filteredAppointments.forEach(appointment => {
            const date = format(parseISO(appointment.startTime), 'yyyy-MM-dd');
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(appointment);
        });

        // Sort each group by time
        Object.keys(groups).forEach(date => {
            groups[date].sort((a, b) =>
                parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
            );
        });

        return groups;
    }, [filteredAppointments]);

    const handleViewDetails = (appointmentId: string) => {
        
        navigate({
            to: `/dashboard/doctor/appointments/${appointmentId}`,
            params: { appointmentId }
        });
        
        setTimeout(() => {
        }, 100);
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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        My Appointments
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your patient appointments and schedule
                    </p>
                </div>

                {/* Filters and Search */}
                <Card className="mb-6 sm:mb-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        placeholder="Search patients..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 lg:gap-3">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-40 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="booked">Booked</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger className="w-full sm:w-40 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                        <SelectValue placeholder="Date" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Dates</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="past">Past</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointments Grid */}
                {Object.keys(groupedAppointments).length === 0 ? (
                    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                        <CardContent className="p-8 text-center">
                            <CalendarIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No appointments found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                                    ? 'Try adjusting your search criteria or filters.'
                                    : 'You don\'t have any appointments scheduled yet.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedAppointments)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([date, dayAppointments]) => (
                                <div key={date}>
                                    {/* Date Header */}
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                            ({dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''})
                                        </span>
                                    </h2>

                                    {/* Appointments Grid */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                                        {dayAppointments.map((appointment) => (
                                            <AppointmentCard
                                                key={appointment.id}
                                                appointment={appointment}
                                                onViewDetails={handleViewDetails}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}