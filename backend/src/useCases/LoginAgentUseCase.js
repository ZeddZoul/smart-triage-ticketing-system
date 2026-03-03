const { UnauthorizedError } = require('../entities/errors');

class LoginAgentUseCase {
  constructor(agentRepository, authService) {
    this.agentRepository = agentRepository;
    this.authService = authService;
  }

  async execute({ email, password }) {
    const agent = await this.agentRepository.findByEmail(email);
    if (!agent) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const ok = await this.authService.comparePassword(password, agent.password_hash);
    if (!ok) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = await this.authService.generateToken({
      agentId: agent.id,
      email: agent.email,
      role: agent.role,
    });

    return {
      token,
      agent: {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        role: agent.role,
      },
    };
  }
}

module.exports = LoginAgentUseCase;
