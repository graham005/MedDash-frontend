import { createFileRoute } from '@tanstack/react-router';
import ParamedicEMSDashboard from '@/components/ems/paramedic/ParamedicEMSDashboard';

export const Route = createFileRoute('/dashboard/paramedic/ems')({
  component: ParamedicEMSDashboard,
});
