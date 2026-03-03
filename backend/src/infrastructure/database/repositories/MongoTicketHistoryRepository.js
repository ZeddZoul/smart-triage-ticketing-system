const ITicketHistoryRepository = require('../../../interfaces/repositories/ITicketHistoryRepository');
const TicketHistoryModel = require('../models/TicketHistoryModel');

class MongoTicketHistoryRepository extends ITicketHistoryRepository {
  async create(historyData) {
    const doc = await TicketHistoryModel.create(historyData);
    return this._map(doc.toObject());
  }

  async findByTicketId(ticketId) {
    const docs = await TicketHistoryModel.find({ ticket_id: ticketId }).sort({ created_at: 1 }).lean();
    return docs.map((d) => this._map(d));
  }

  _map(doc) {
    return {
      id: String(doc._id || doc.id),
      ticket_id: String(doc.ticket_id),
      action: doc.action,
      performed_by_agent_id: doc.performed_by_agent_id ? String(doc.performed_by_agent_id) : null,
      previous_value: doc.previous_value ?? null,
      new_value: doc.new_value ?? null,
      notes: doc.notes ?? null,
      created_at: doc.created_at,
    };
  }
}

module.exports = MongoTicketHistoryRepository;
