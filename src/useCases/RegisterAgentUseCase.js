const { ConflictError } = require('../entities/errors');

class RegisterAgentUseCase {
  constructor(agentRepository, authService) {
    this.agentRepository = agentRepository;
    this.authService = authService;
  }

  async execute({ email, password, name }) {
    const existing = await this.agentRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered', { email });
    }

    const password_hash = await this.authService.hashPassword(password);
    const created = await this.agentRepository.create({
      email,
      password_hash,
      name,
      role: 'agent',
    });

    const { password_hash: _omit, ...safe } = created;
    return safe;
  }
}

module.exports = RegisterAgentUseCase;
