import RefillRequests from '@/components/doctor/RefillRequests'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/refill-requests')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><RefillRequests /></div>
}
