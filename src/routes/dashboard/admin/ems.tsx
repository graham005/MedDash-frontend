import { createFileRoute } from '@tanstack/react-router';
import AdminEMSDashboard from '@/components/ems/admin/AdminEMSDashboard';

export const Route = createFileRoute('/dashboard/admin/ems')({
  component: AdminEMSDashboard,
});
