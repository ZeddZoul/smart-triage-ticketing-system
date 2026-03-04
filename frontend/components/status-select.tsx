"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VALID_TRANSITIONS, formatStatus } from "@/lib/types";
import type { TicketStatus } from "@/lib/types";

interface StatusSelectProps {
  currentStatus: TicketStatus;
  onStatusChange: (newStatus: TicketStatus) => void;
  disabled?: boolean;
}

export function StatusSelect({
  currentStatus,
  onStatusChange,
  disabled,
}: StatusSelectProps) {
  const validTargets = VALID_TRANSITIONS[currentStatus] || [];

  // If no valid transitions (e.g. Closed), just display the badge
  if (validTargets.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {formatStatus(currentStatus)}
      </span>
    );
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => onStatusChange(value as TicketStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={currentStatus} disabled>
          {formatStatus(currentStatus)}
        </SelectItem>
        {validTargets.map((status) => (
          <SelectItem key={status} value={status}>
            {formatStatus(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
