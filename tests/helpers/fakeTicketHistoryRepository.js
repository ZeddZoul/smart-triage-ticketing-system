const ITicketHistoryRepository = require('../../src/interfaces/repositories/ITicketHistoryRepository');
const { objectIdLike } = require('./testFactory');

class FakeTicketHistoryRepository extends ITicketHistoryRepository {
  constructor(initialHistory = []) {
    super();
    this.history = Array.isArray(initialHistory) ? [...initialHistory] : [];
  }

  async create(historyData) {
    const record = {
      id: objectIdLike(),
      ticket_id: historyData.ticket_id,
      action: historyData.action,
      performed_by_agent_id: historyData.performed_by_agent_id ?? null,
      previous_value: historyData.previous_value ?? null,
      new_value: historyData.new_value ?? null,
      notes: historyData.notes ?? null,
      created_at: historyData.created_at ?? new Date(),
    };

    this.history.push(record);
    return { ...record };
  }

  async findByTicketId(ticketId) {
    return this.history
      .filter((h) => h.ticket_id === ticketId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((h) => ({ ...h }));
  }

  clear() {
    this.history = [];
  }
}

module.exports = FakeTicketHistoryRepository;
