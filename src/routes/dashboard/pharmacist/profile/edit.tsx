import EditPharmacistProfile from '@/components/pharmacist/profile/EditProfile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/pharmacist/profile/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><EditPharmacistProfile /></div>
}
