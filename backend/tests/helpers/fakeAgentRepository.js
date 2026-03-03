const IAgentRepository = require('../../src/interfaces/repositories/IAgentRepository');
const { objectIdLike } = require('./testFactory');

class FakeAgentRepository extends IAgentRepository {
  constructor(initialAgents = []) {
    super();
    this.agents = new Map();
    initialAgents.forEach((a) => this.agents.set(a.id, { ...a }));
  }

  async create(agentData) {
    const exists = Array.from(this.agents.values()).find((a) => a.email === agentData.email);
    if (exists) {
      const err = new Error('Duplicate email');
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const now = new Date();
    const agent = {
      id: objectIdLike(),
      email: agentData.email,
      password_hash: agentData.password_hash,
      name: agentData.name,
      role: agentData.role || 'agent',
      created_at: now,
      updated_at: now,
    };

    this.agents.set(agent.id, agent);
    return { ...agent };
  }

  async findByEmail(email) {
    const found = Array.from(this.agents.values()).find((a) => a.email === email);
    return found ? { ...found } : null;
  }

  async findById(id) {
    const found = this.agents.get(id);
    return found ? { ...found } : null;
  }

  clear() {
    this.agents.clear();
  }
}

module.exports = FakeAgentRepository;
