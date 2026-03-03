const ITicketRepository = require('../../src/interfaces/repositories/ITicketRepository');
const { objectIdLike } = require('./testFactory');

class FakeTicketRepository extends ITicketRepository {
  constructor(initialTickets = []) {
    super();
    this.tickets = new Map();
    initialTickets.forEach((t) => this.tickets.set(t.id, { ...t }));
  }

  async create(ticketData) {
    const now = new Date();
    const ticket = {
      id: objectIdLike(),
      title: ticketData.title,
      description: ticketData.description,
      customer_email: ticketData.customer_email,
      status: ticketData.status,
      category: ticketData.category ?? null,
      priority: ticketData.priority ?? null,
      triage_attempts: ticketData.triage_attempts ?? 0,
      created_at: ticketData.created_at ?? now,
      updated_at: ticketData.updated_at ?? now,
    };

    this.tickets.set(ticket.id, ticket);
    return { ...ticket };
  }

  async findById(id) {
    const found = this.tickets.get(id);
    return found ? { ...found } : null;
  }

  async findAll(filters = {}, pagination = {}, sort = {}) {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 10));
    const sortBy = sort.sortBy || 'created_at';
    const sortOrder = sort.sortOrder === 'asc' ? 'asc' : 'desc';

    let data = Array.from(this.tickets.values());

    if (filters.status) {
      data = data.filter((t) => t.status === filters.status);
    }
    if (filters.priority) {
      data = data.filter((t) => t.priority === filters.priority);
    }
    if (filters.category) {
      data = data.filter((t) => t.category === filters.category);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      data = data.filter(
        (t) => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term),
      );
    }

    data.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = data.length;
    const start = (page - 1) * limit;
    const paged = data.slice(start, start + limit);

    return {
      data: paged.map((t) => ({ ...t })),
      total,
      page,
      limit,
    };
  }

  async updateById(id, updateData) {
    const existing = this.tickets.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updateData,
      updated_at: updateData.updated_at ?? new Date(),
    };

    this.tickets.set(id, updated);
    return { ...updated };
  }

  async findByStatus(status) {
    return Array.from(this.tickets.values())
      .filter((t) => t.status === status)
      .map((t) => ({ ...t }));
  }

  clear() {
    this.tickets.clear();
  }
}

module.exports = FakeTicketRepository;
