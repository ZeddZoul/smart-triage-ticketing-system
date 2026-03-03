"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Ticket } from "@/lib/types";

interface DashboardStatsProps {
  tickets: Ticket[];
  totalCount: number;
}

export function DashboardStats({ tickets, totalCount }: DashboardStatsProps) {
  // Status counts
  const statusCounts = {
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    resolved: tickets.filter((t) => t.status === "Resolved").length,
    closed: tickets.filter((t) => t.status === "Closed").length,
    pendingTriage: tickets.filter(
      (t) => t.status === "pending_triage" || t.status === "triage_failed",
    ).length,
  };

  // Priority counts
  const priorityCounts = {
    high: tickets.filter((t) => t.priority === "High").length,
    medium: tickets.filter((t) => t.priority === "Medium").length,
    low: tickets.filter((t) => t.priority === "Low").length,
  };

  const stats = [
    { label: "Total", value: totalCount, color: "text-foreground" },
    { label: "Open", value: statusCounts.open, color: "text-blue-600" },
    {
      label: "In Progress",
      value: statusCounts.inProgress,
      color: "text-amber-600",
    },
    {
      label: "Resolved",
      value: statusCounts.resolved,
      color: "text-green-600",
    },
    {
      label: "High Priority",
      value: priorityCounts.high,
      color: "text-red-600",
    },
    {
      label: "Pending Triage",
      value: statusCounts.pendingTriage,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
