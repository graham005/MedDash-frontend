import { createFileRoute } from '@tanstack/react-router'
import PatientEMSDashboard from '@/components/ems/patient/PatientEMSDashboard';

export const Route = createFileRoute('/dashboard/patient/ems/')({
  component: PatientEMSDashboard
})

