import { createFileRoute } from '@tanstack/react-router';
import EMSRequest from '@/components/ems/patient/EMSRequest';

export const Route = createFileRoute('/dashboard/patient/ems/request')({
  component: EMSRequest,
});
