import Admins from '@/components/admin/usersProfiles/Admins'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/users/admins')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Admins /></div>
}
