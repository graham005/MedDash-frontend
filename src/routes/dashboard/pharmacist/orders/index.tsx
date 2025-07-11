import Orders from '@/components/pharmacist/Orders'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/orders/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><Orders /></div>
}
