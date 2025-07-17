import Doctors from '@/components/admin/usersProfiles/Doctors'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/users/doctors')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Doctors /></div>
}
