'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '@/components/priority-badge';
import { StatusSelect } from '@/components/status-select';
import type { Ticket, TicketStatus } from '@/lib/types';

interface TicketTableProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
  onRetriage: (ticketId: string) => void;
  updatingId?: string | null;
  retriagingId?: string | null;
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function TicketTable({
  tickets,
  onStatusChange,
  onRetriage,
  updatingId,
  retriagingId,
}: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No tickets found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="text-right">Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const canRetriage =
              ticket.status === 'pending_triage' || ticket.status === 'triage_failed';

            return (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">
                  <div>
                    <p className="truncate max-w-[280px]">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {ticket.customer_email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusSelect
                    currentStatus={ticket.status}
                    onStatusChange={(newStatus) => onStatusChange(ticket.id, newStatus)}
                    disabled={updatingId === ticket.id}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm">{ticket.category || '—'}</span>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatTimeAgo(ticket.created_at)}
                </TableCell>
                <TableCell>
                  {canRetriage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetriage(ticket.id)}
                      disabled={retriagingId === ticket.id}
                    >
                      {retriagingId === ticket.id ? 'Triaging…' : 'Retriage'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
