import { Badge } from '@/components/ui/badge';
import type { TicketPriority } from '@/lib/types';

const priorityConfig: Record<string, { label: string; className: string }> = {
  High: {
    label: '🔴 High',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  Medium: {
    label: '🟡 Medium',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  Low: {
    label: '🟢 Low',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
};

export function PriorityBadge({ priority }: { priority: TicketPriority | null }) {
  if (!priority) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-500 hover:bg-gray-100">
        —
      </Badge>
    );
  }

  const config = priorityConfig[priority] || {
    label: priority,
    className: '',
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
