import PharmacistProfile from '@/components/pharmacist/profile/Profile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/profile/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><PharmacistProfile /></div>
}
