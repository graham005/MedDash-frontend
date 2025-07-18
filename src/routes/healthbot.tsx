import { HealthBot } from '@/components/Healthbot/HealthBot'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/healthbot')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><HealthBot /></div>
}
