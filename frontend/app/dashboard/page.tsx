"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getTickets, updateTicketStatus, retriageTicket } from "@/lib/api";
import { TicketFiltersBar } from "@/components/ticket-filters";
import { TicketTable } from "@/components/ticket-table";
import { DashboardStats } from "@/components/dashboard-stats";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Ticket,
  TicketFilters,
  PaginationMeta,
  TicketStatus,
} from "@/lib/types";

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    limit: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [retriagingId, setRetriagingId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getTickets(filters);
      setTickets(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tickets";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleFiltersChange = (newFilters: TicketFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleStatusChange = async (
    ticketId: string,
    newStatus: TicketStatus,
  ) => {
    // Optimistic update
    const previousTickets = [...tickets];
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );
    setUpdatingId(ticketId);

    try {
      await updateTicketStatus(ticketId, { status: newStatus });
      toast.success("Status updated");
    } catch (err) {
      // Revert on failure
      setTickets(previousTickets);
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRetriage = async (ticketId: string) => {
    setRetriagingId(ticketId);
    try {
      const updated = await retriageTicket(ticketId);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      if (updated.status === "Open") {
        toast.success("Ticket triaged successfully!");
      } else {
        toast.warning(
          "Triage attempted but did not succeed. You may try again.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to retriage ticket";
      toast.error(message);
    } finally {
      setRetriagingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Support Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {pagination.total} ticket{pagination.total !== 1 ? "s" : ""}
        </p>
      </div>

      <TicketFiltersBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        tickets={tickets}
      />

      <DashboardStats tickets={tickets} totalCount={pagination.total} />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <TicketTable
          tickets={tickets}
          onStatusChange={handleStatusChange}
          onRetriage={handleRetriage}
          updatingId={updatingId}
          retriagingId={retriagingId}
        />
      )}

      {!isLoading && pagination.totalPages > 0 && (
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      )}
    </div>
  );
}
