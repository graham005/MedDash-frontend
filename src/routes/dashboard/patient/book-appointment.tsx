import BookAppointment from '@/components/patient/BookAppointment'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/book-appointment')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><BookAppointment /></div>
}
