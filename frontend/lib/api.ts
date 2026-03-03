import type {
  Ticket,
  TicketListResponse,
  TicketFilters,
  TicketHistory,
  LoginResponse,
  Agent,
  CreateTicketData,
  UpdateTicketStatusData,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // On 401 for non-login requests, clear auth and redirect to login
    const isLoginRequest = endpoint === '/auth/login';
    if (res.status === 401 && !isLoginRequest) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('agent');
        window.location.href = '/login';
      }
    }

    let errorData;
    try {
      errorData = await res.json();
    } catch {
      throw new ApiRequestError('An unexpected error occurred', 'UNKNOWN_ERROR', res.status);
    }

    throw new ApiRequestError(
      errorData?.error?.message || 'Request failed',
      errorData?.error?.code || 'UNKNOWN_ERROR',
      res.status,
      errorData?.error?.details,
    );
  }

  return res.json() as Promise<T>;
}

// ----- Ticket API -----

export async function createTicket(data: CreateTicketData): Promise<Ticket> {
  return apiFetch<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getTickets(filters: TicketFilters = {}): Promise<TicketListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

  const query = params.toString();
  return apiFetch<TicketListResponse>(`/tickets${query ? `?${query}` : ''}`);
}

export async function getTicketById(id: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${id}`);
}

export async function updateTicketStatus(
  id: string,
  data: UpdateTicketStatusData,
): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function retriageTicket(id: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${id}/retriage`, {
    method: 'POST',
  });
}

export async function getTicketHistory(id: string): Promise<TicketHistory[]> {
  return apiFetch<TicketHistory[]>(`/tickets/${id}/history`);
}

// ----- Auth API -----

export async function loginAgent(credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerAgent(data: {
  email: string;
  password: string;
  name: string;
}): Promise<Agent> {
  return apiFetch<Agent>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export { ApiRequestError };
