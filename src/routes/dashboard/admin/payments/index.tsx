import Payments from '@/components/admin/Payments'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/admin/payments/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Payments /></div>
}
