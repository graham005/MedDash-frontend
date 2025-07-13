import CreatePharmacistProfile from '@/components/pharmacist/profile/CreateProfile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/profile/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><CreatePharmacistProfile /></div>
}
