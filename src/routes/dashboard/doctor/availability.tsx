import AvailabilityPlanner from '@/components/doctor/Availability'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/availability')({
  component: AvailabilityPlanner,
})


