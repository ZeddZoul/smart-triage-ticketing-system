const ITicketRepository = require('../../../interfaces/repositories/ITicketRepository');
const TicketModel = require('../models/TicketModel');

class MongoTicketRepository extends ITicketRepository {
  async create(ticketData) {
    const doc = await TicketModel.create(ticketData);
    return this._map(doc);
  }

  async findById(id) {
    const doc = await TicketModel.findById(id).lean();
    return doc ? this._map(doc) : null;
  }

  async findAll(filters = {}, pagination = {}, sort = {}) {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pagination.limit) || 10));
    const skip = (page - 1) * limit;

    const sortBy = sort.sortBy || 'created_at';
    const sortOrder = sort.sortOrder === 'asc' ? 1 : -1;

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.category) query.category = filters.category;
    if (filters.search) {
      const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [docs, total] = await Promise.all([
      TicketModel.find(query).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).lean(),
      TicketModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => this._map(d)),
      total,
      page,
      limit,
    };
  }

  async updateById(id, updateData) {
    const doc = await TicketModel.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updated_at: new Date(),
      },
      { returnDocument: 'after', runValidators: true, lean: true },
    );

    return doc ? this._map(doc) : null;
  }

  async findByStatus(status) {
    const docs = await TicketModel.find({ status }).sort({ created_at: -1 }).lean();
    return docs.map((d) => this._map(d));
  }

  async getDistinctFacets() {
    const [categories, priorities] = await Promise.all([
      TicketModel.distinct('category', { category: { $ne: null } }),
      TicketModel.distinct('priority', { priority: { $ne: null } }),
    ]);
    return {
      categories: categories.filter(Boolean).sort(),
      priorities: priorities.filter(Boolean).sort(),
    };
  }

  _map(doc) {
    if (!doc) return null;
    return {
      id: String(doc._id || doc.id),
      title: doc.title,
      description: doc.description,
      customer_email: doc.customer_email,
      status: doc.status,
      category: doc.category ?? null,
      priority: doc.priority ?? null,
      triage_attempts: doc.triage_attempts ?? 0,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }
}

module.exports = MongoTicketRepository;
