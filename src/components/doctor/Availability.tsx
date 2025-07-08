import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Clock, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  useDoctorAvailabilitySlots,
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot
} from '@/hooks/useAvailability'; // <-- Import hooks directly
import { availabilityApi } from '@/api/availability';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CreateAvailabilitySlotDto } from '@/api/availability';

interface TimeSlot {
  start: string;
  end: string;
  type: 'standard' | 'emergency' | 'consultation';
}

interface AvailabilityPlannerProps {
  className?: string;
}

const SLOT_TYPES = [
  { value: 'standard', label: 'Standard', color: 'bg-blue-500' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-500' },
  { value: 'consultation', label: 'Consultation', color: 'bg-green-500' }
] as const;

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export default function AvailabilityPlanner({ className }: AvailabilityPlannerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [viewMode, setViewMode] = useState<'weekdays' | 'weekends' | 'custom'>('weekdays');
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Use the hooks directly
  const { data: availabilitySlots = [], isLoading: isLoadingAvailability, error: availabilityError } = useDoctorAvailabilitySlots();
  const { mutateAsync: createSlotAsync, isPending: isCreatingSlot, error: createSlotError } = useCreateAvailabilitySlot();
  const { mutateAsync: deleteSlotAsync, isPending: isDeletingSlot } = useDeleteAvailabilitySlot();

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get slots for selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate || !availabilitySlots) return [];
    
    return availabilitySlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return isSameDay(slotDate, selectedDate);
    });
  }, [selectedDate, availabilitySlots]);

  // Check for conflicts
  useEffect(() => {
    if (!selectedDate || selectedSlots.length === 0) {
      setConflicts([]);
      return;
    }

    const newConflicts: string[] = [];
    
    selectedSlots.forEach(newSlot => {
      const newStart = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newSlot.start}`);
      const newEnd = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newSlot.end}`);
      
      slotsForSelectedDate.forEach(existingSlot => {
        const existingStart = new Date(existingSlot.startTime);
        const existingEnd = new Date(existingSlot.endTime);
        
        if (
          (newStart < existingEnd && newEnd > existingStart) ||
          (existingStart < newEnd && existingEnd > newStart)
        ) {
          newConflicts.push(`${newSlot.start}-${newSlot.end} overlaps with existing slot at ${format(existingStart, 'HH:mm')}-${format(existingEnd, 'HH:mm')}`);
        }
      });
    });
    
    setConflicts(newConflicts);
  }, [selectedSlots, slotsForSelectedDate, selectedDate]);

  const handleDateClick = (date: Date) => {
    if (isBefore(date, today)) return;
    setSelectedDate(date);
    setSelectedSlots([]);
    setIsAddingSlot(false);
  };

  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    if (!selectedDate) return;
    
    const newSlot: TimeSlot = {
      start: startTime,
      end: endTime,
      type: 'standard'
    };
    
    setSelectedSlots(prev => [...prev, newSlot]);
  };

  const handleSlotTypeChange = (index: number, type: 'standard' | 'emergency' | 'consultation') => {
    setSelectedSlots(prev => 
      prev.map((slot, i) => i === index ? { ...slot, type } : slot)
    );
  };

  const handleRemoveSlot = (index: number) => {
    setSelectedSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSlots = async () => {
    if (!selectedDate || selectedSlots.length === 0 || conflicts.length > 0) return;

    try {
      for (const slot of selectedSlots) {
        // Create proper date objects and convert to ISO string
        const startDateTime = new Date(selectedDate);
        const endDateTime = new Date(selectedDate);
        
        // Parse time strings (HH:mm) and set them
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);
        
        startDateTime.setHours(startHour, startMinute, 0, 0);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        const slotData: CreateAvailabilitySlotDto = {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: slot.type
        };
        
        
        // Use mutateAsync for promise-based handling
        await createSlotAsync(slotData);
      }
      
      setSelectedSlots([]);
      setIsAddingSlot(false);
    } catch (error) {
      console.error('Error creating availability slots:', error);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlotAsync(slotId);
    } catch (error) {
      console.error('Error deleting availability slot:', error);
    }
  };

  const handleCopyToWeekdays = () => {
    if (!selectedDate || selectedSlots.length === 0) return;
    
    // Get all weekdays in current month that are not before today
    const weekdays = monthDays.filter((day: Date) => {
      const dayOfWeek = day.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5 && !isBefore(day, today);
    });
    
    weekdays.forEach(async (day: Date) => {
      if (isSameDay(day, selectedDate)) return; // Skip the original day
      
      for (const slot of selectedSlots) {
        // Create proper date objects and convert to ISO string
        const startDateTime = new Date(day);
        const endDateTime = new Date(day);
        
        // Parse time strings (HH:mm) and set them
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);
        
        startDateTime.setHours(startHour, startMinute, 0, 0);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        const slotData: CreateAvailabilitySlotDto = {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          type: slot.type
        };
        
        try {
          await createSlotAsync(slotData);
        } catch (error) {
          console.error('Error copying slot to weekday:', error);
        }
      }
    });
  };

  const renderTimeSlotGrid = () => {
    const timeSlots = [];
    
    for (let i = 0; i < TIME_SLOTS.length - 1; i++) {
      const startTime = TIME_SLOTS[i];
      const endTime = TIME_SLOTS[i + 1];
      const isSelected = selectedSlots.some(slot => slot.start === startTime && slot.end === endTime);
      const hasExistingSlot = slotsForSelectedDate.some(slot => {
        const slotStart = format(new Date(slot.startTime), 'HH:mm');
        const slotEnd = format(new Date(slot.endTime), 'HH:mm');
        return slotStart === startTime && slotEnd === endTime;
      });
      
      timeSlots.push(
        <div
          key={`${startTime}-${endTime}`}
          className={cn(
            "h-12 border rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-sm font-medium",
            isSelected && "bg-blue-500 text-white dark:bg-blue-600",
            hasExistingSlot && "bg-gray-300 dark:bg-gray-600 cursor-not-allowed",
            !isSelected && !hasExistingSlot && "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
          )}
          onClick={() => {
            if (!hasExistingSlot && !isSelected) {
              handleTimeSlotSelect(startTime, endTime);
            }
          }}
        >
          {startTime} - {endTime}
        </div>
      );
    }
    
    return timeSlots;
  };

  if (isLoadingAvailability) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 w-full h-screen", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold">Set Your Availability</h1>
        <p className="text-blue-100 mt-2">
          Manage appointments for {format(currentDate, 'MMMM yyyy')}
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day: Date) => {
              const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
              const isPastDay = isBefore(day, today);
              const hasSlotsForDay = availabilitySlots?.some(slot => 
                isSameDay(new Date(slot.startTime), day)
              );
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  disabled={isPastDay}
                  className={cn(
                    "h-10 w-10 rounded-full text-sm transition-all duration-200 relative",
                    isSelectedDay && "bg-blue-500 text-white dark:bg-blue-600",
                    isPastDay && "text-gray-300 dark:text-gray-600 cursor-not-allowed",
                    !isSelectedDay && !isPastDay && "hover:bg-gray-100 dark:hover:bg-gray-800",
                    isToday(day) && !isSelectedDay && "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  )}
                >
                  {format(day, 'd')}
                  {hasSlotsForDay && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Time Slots for {format(selectedDate, 'MMMM dd')}</CardTitle>
                <CardDescription>
                  {slotsForSelectedDate.length > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      {slotsForSelectedDate.length} slot(s) already scheduled
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsAddingSlot(true)}
                disabled={isAddingSlot}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Slot
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Existing slots */}
            {slotsForSelectedDate.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Existing Slots</h3>
                <div className="space-y-2">
                  {slotsForSelectedDate.map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          slot.type === 'standard' && "bg-blue-500",
                          slot.type === 'emergency' && "bg-red-500",
                          slot.type === 'consultation' && "bg-green-500"
                        )} />
                        <div>
                          <div className="font-medium text-sm">
                            {format(new Date(slot.startTime), 'HH:mm')} - {format(new Date(slot.endTime), 'HH:mm')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(slot.type ?? 'standard').toLowerCase()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={isDeletingSlot}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new slots */}
            {isAddingSlot && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'weekdays' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('weekdays')}
                  >
                    Weekdays
                  </Button>
                  <Button
                    variant={viewMode === 'weekends' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('weekends')}
                  >
                    Weekends
                  </Button>
                  <Button
                    variant={viewMode === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('custom')}
                  >
                    Custom
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {renderTimeSlotGrid()}
                </div>

                {/* Selected slots configuration */}
                {selectedSlots.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Configure Selected Slots</h3>
                    <div className="space-y-3">
                      {selectedSlots.map((slot, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium">{slot.start} - {slot.end}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={slot.type}
                              onChange={(e) => handleSlotTypeChange(index, e.target.value as any)}
                              className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700"
                            >
                              {SLOT_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSlot(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Conflicts */}
                    {conflicts.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <h4 className="font-medium text-red-800 dark:text-red-200">Conflict Detected</h4>
                        </div>
                        <div className="space-y-1">
                          {conflicts.map((conflict, index) => (
                            <p key={index} className="text-sm text-red-700 dark:text-red-300">
                              {conflict}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copy to all weekdays */}
                    {selectedSlots.length > 0 && (
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyToWeekdays}
                          disabled={isCreatingSlot}
                        >
                          Copy to All Weekdays
                        </Button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-4">
                      <Button
                        onClick={handleSaveSlots}
                        disabled={conflicts.length > 0 || isCreatingSlot}
                        size="sm"
                      >
                        {isCreatingSlot ? 'Saving...' : 'Save Slots'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingSlot(false);
                          setSelectedSlots([]);
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error messages */}
      {(createSlotError || availabilityError) && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">
            {createSlotError?.message || availabilityError?.message || 'An error occurred'}
          </p>
        </div>
      )}
    </div>
  );
}
