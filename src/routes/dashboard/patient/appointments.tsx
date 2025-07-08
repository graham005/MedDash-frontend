import AppointmentPage from '@/components/patient/Appointment'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/appointments')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><AppointmentPage /></div>
}
