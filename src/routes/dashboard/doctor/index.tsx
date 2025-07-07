import DoctorDashboard from '@/components/doctor/Dashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/')({
  component: DoctorDashboard,
})


