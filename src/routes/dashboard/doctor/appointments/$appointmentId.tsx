import { createFileRoute } from '@tanstack/react-router'
import AppointmentDetails from '@/components/doctor/AppointmentDetails'

export const Route = createFileRoute('/dashboard/doctor/appointments/$appointmentId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { appointmentId } = Route.useParams()
  return <AppointmentDetails appointmentId={appointmentId} />
}
