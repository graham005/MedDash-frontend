import AdminProfileDetails from '@/components/admin/Profile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><AdminProfileDetails /></div>
}
