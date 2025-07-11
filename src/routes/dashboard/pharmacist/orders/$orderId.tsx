import OrderDetails from '@/components/pharmacist/OrderDetails'
import { createFileRoute } from '@tanstack/react-router'
import { useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/orders/$orderId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  return <OrderDetails orderId={orderId} />;
}
