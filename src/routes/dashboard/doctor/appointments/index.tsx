import DoctorAppointments from '@/components/doctor/Appointments'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/doctor/appointments/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><DoctorAppointments /> </div>
}
