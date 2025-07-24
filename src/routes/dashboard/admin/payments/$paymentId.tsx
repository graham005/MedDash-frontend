import { createFileRoute } from '@tanstack/react-router'
import PaymentDetails from '@/components/admin/PaymentDetails'

export const Route = createFileRoute('/dashboard/admin/payments/$paymentId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <PaymentDetails />
}
