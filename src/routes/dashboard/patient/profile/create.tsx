import CreatePatientProfile from '@/components/patient/profile/CreateProfile'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/patient/profile/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <CreatePatientProfile isOpen={true} onClose={() => {}} />
    </div>
  )
}
