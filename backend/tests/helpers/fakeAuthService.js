const IAuthService = require('../../src/interfaces/services/IAuthService');

class FakeAuthService extends IAuthService {
  async hashPassword(plaintext) {
    return `hashed_${plaintext}`;
  }

  async comparePassword(plaintext, hash) {
    return hash === `hashed_${plaintext}`;
  }

  async generateToken(payload) {
    return JSON.stringify({
      sub: payload.agentId,
      email: payload.email,
      role: payload.role,
      iat: Date.now(),
      provider: 'fake-auth-service',
    });
  }

  async verifyToken(token) {
    try {
      const parsed = JSON.parse(token);
      return {
        agentId: parsed.sub,
        email: parsed.email,
        role: parsed.role,
      };
    } catch (_err) {
      const err = new Error('Invalid token');
      err.code = 'INVALID_TOKEN';
      throw err;
    }
  }
}

module.exports = FakeAuthService;
