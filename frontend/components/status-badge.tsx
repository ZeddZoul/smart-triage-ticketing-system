import { Badge } from '@/components/ui/badge';
import type { TicketStatus } from '@/lib/types';

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  Open: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  'In Progress': {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  Resolved: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  Closed: {
    label: 'Closed',
    className: 'bg-gray-200 text-gray-700 hover:bg-gray-200',
  },
  pending_triage: {
    label: 'Pending Triage',
    className: 'bg-gray-100 text-gray-600 hover:bg-gray-100',
  },
  triage_failed: {
    label: 'Triage Failed',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status] || {
    label: status,
    className: '',
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
