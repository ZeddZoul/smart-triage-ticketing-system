'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getTicketById, getTicketHistory, updateTicketStatus, retriageTicket } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { StatusSelect } from '@/components/status-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Ticket, TicketHistory } from '@/lib/types';

const actionLabels: Record<string, string> = {
  created: 'Ticket Created',
  triage_started: 'Triage Started',
  triage_completed: 'Triage Completed',
  triage_failed: 'Triage Failed',
  status_changed: 'Status Changed',
};

const actionColors: Record<string, string> = {
  created: 'bg-blue-500',
  triage_started: 'bg-amber-500',
  triage_completed: 'bg-green-500',
  triage_failed: 'bg-red-500',
  status_changed: 'bg-purple-500',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HistoryTimeline({ history }: { history: TicketHistory[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No history records yet.</p>;
  }

  const sorted = [...history].reverse();

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-1.75 top-2 bottom-2 w-0.5 bg-border" />

      {sorted.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Dot */}
          <div
            className={`relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 border-background ${actionColors[entry.action] || 'bg-gray-400'}`}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {actionLabels[entry.action] || entry.action}
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
            </div>

            {/* Show value changes */}
            {entry.previous_value && entry.new_value && (
              <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                {typeof entry.new_value.status === 'string' && typeof entry.previous_value.status === 'string' && (
                  <p>
                    Status: <span className="font-medium">{entry.previous_value.status}</span>
                    {' → '}
                    <span className="font-medium">{entry.new_value.status}</span>
                  </p>
                )}
                {typeof entry.new_value.category === 'string' && (
                  <p>
                    Category: <span className="font-medium">{entry.new_value.category}</span>
                  </p>
                )}
                {typeof entry.new_value.priority === 'string' && (
                  <p>
                    Priority: <span className="font-medium">{entry.new_value.priority}</span>
                  </p>
                )}
              </div>
            )}

            {entry.notes && (
              <p className="mt-1 text-xs text-muted-foreground italic">{entry.notes}</p>
            )}

            {entry.performed_by_agent_id && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                by Agent {entry.performed_by_agent_id.slice(-6)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRetriaging, setIsRetriaging] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ticketData, historyData] = await Promise.all([
        getTicketById(ticketId),
        getTicketHistory(ticketId),
      ]);
      setTicket(ticketData);
      setHistory(historyData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load ticket';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (newStatus: Ticket['status']) => {
    if (!ticket) return;
    // Optimistic update
    const previousTicket = ticket;
    setTicket({ ...ticket, status: newStatus });
    setIsUpdating(true);
    try {
      const updated = await updateTicketStatus(ticketId, { status: newStatus });
      setTicket(updated);
      const historyData = await getTicketHistory(ticketId);
      setHistory(historyData);
      toast.success('Status updated');
    } catch (err) {
      // Revert on failure
      setTicket(previousTicket);
      const message = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRetriage = async () => {
    if (!ticket) return;
    setIsRetriaging(true);
    try {
      const updated = await retriageTicket(ticketId);
      setTicket(updated);
      const historyData = await getTicketHistory(ticketId);
      setHistory(historyData);
      if (updated.status === 'Open') {
        toast.success('Ticket triaged successfully!');
      } else {
        toast.warning('Triage attempted but did not succeed. You may try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retriage ticket';
      toast.error(message);
    } finally {
      setIsRetriaging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground">Ticket not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const canRetriage = ticket.status === 'pending_triage' || ticket.status === 'triage_failed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground"
            onClick={() => router.push('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold tracking-tight wrap-break-word">{ticket.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ticket.customer_email}</p>
        </div>
      </div>

      {/* Ticket Info Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Description Card — spans 2 columns */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
          </CardContent>
        </Card>

        {/* Details Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
              <StatusSelect
                currentStatus={ticket.status}
                onStatusChange={handleStatusChange}
                disabled={isUpdating}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Category</p>
              <p className="text-sm font-medium">{ticket.category || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
              <p className="text-sm">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Updated</p>
              <p className="text-sm">{formatDate(ticket.updated_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Triage Attempts</p>
              <p className="text-sm">{ticket.triage_attempts}</p>
            </div>

            {canRetriage && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleRetriage}
                disabled={isRetriaging}
              >
                {isRetriaging ? 'Triaging…' : 'Retriage Ticket'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryTimeline history={history} />
        </CardContent>
      </Card>
    </div>
  );
}
