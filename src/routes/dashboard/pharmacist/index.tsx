import PharmacistHomePage from '@/components/pharmacist/HomePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PharmacistHomePage /></div>
}
