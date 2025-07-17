import Patients from '@/components/admin/usersProfiles/Patients'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/users/patients')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Patients /></div>
}
