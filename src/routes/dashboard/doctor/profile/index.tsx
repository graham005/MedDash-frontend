import DoctorProfileDetails from '@/components/doctor/profile/ProfileDetails'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/doctor/profile/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><DoctorProfileDetails /></div>
}
