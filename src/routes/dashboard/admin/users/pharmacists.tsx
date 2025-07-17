import Pharmacist from '@/components/admin/usersProfiles/Pharmacist'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/users/pharmacists')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Pharmacist /></div>
}
