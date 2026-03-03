// TypeScript types for the Smart Triage Ticketing System frontend

export type TicketStatus =
  | 'Open'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'pending_triage'
  | 'triage_failed';

export type TicketCategory = 'Technical Bug' | 'Billing' | 'Feature Request';

export type TicketPriority = 'High' | 'Medium' | 'Low';

export type AgentRole = 'agent' | 'admin' | 'read_only';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  customer_email: string;
  status: TicketStatus;
  category: TicketCategory | null;
  priority: TicketPriority | null;
  triage_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  email: string;
  name: string;
  role: AgentRole;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TicketListResponse {
  data: Ticket[];
  pagination: PaginationMeta;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  sortBy?: 'created_at' | 'updated_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

export interface LoginResponse {
  token: string;
  agent: Agent;
}

export interface CreateTicketData {
  title: string;
  description: string;
  customer_email: string;
}

export interface UpdateTicketStatusData {
  status: TicketStatus;
}

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  Open: ['In Progress', 'Resolved'],
  'In Progress': ['Open', 'Resolved'],
  Resolved: ['Open'],
  Closed: [],
  pending_triage: ['Open'],
  triage_failed: ['Open'],
};
