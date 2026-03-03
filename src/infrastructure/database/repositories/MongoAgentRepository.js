const IAgentRepository = require('../../../interfaces/repositories/IAgentRepository');
const AgentModel = require('../models/AgentModel');

class MongoAgentRepository extends IAgentRepository {
  async create(agentData) {
    const doc = await AgentModel.create(agentData);
    return this._mapWithPassword(doc.toObject());
  }

  async findByEmail(email) {
    const doc = await AgentModel.findOne({ email: email.toLowerCase() }).select('+password_hash').lean();
    return doc ? this._mapWithPassword(doc) : null;
  }

  async findById(id) {
    const doc = await AgentModel.findById(id).lean();
    return doc ? this._mapPublic(doc) : null;
  }

  _mapWithPassword(doc) {
    return {
      id: String(doc._id || doc.id),
      email: doc.email,
      password_hash: doc.password_hash,
      name: doc.name,
      role: doc.role,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }

  _mapPublic(doc) {
    return {
      id: String(doc._id || doc.id),
      email: doc.email,
      name: doc.name,
      role: doc.role,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }
}

module.exports = MongoAgentRepository;
