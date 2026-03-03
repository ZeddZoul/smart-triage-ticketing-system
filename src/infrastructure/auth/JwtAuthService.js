const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const IAuthService = require('../../interfaces/services/IAuthService');
const { UnauthorizedError, TokenExpiredError } = require('../../entities/errors');

class JwtAuthService extends IAuthService {
  constructor(config) {
    super();
    this.jwtSecret = config.jwtSecret;
    this.jwtExpiresIn = config.jwtExpiresIn || '24h';
    this.bcryptSaltRounds = config.bcryptSaltRounds || 10;
  }

  async hashPassword(plaintext) {
    return bcrypt.hash(plaintext, this.bcryptSaltRounds);
  }

  async comparePassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  }

  async generateToken(payload) {
    return jwt.sign(
      {
        agentId: payload.agentId,
        email: payload.email,
        role: payload.role,
      },
      this.jwtSecret,
      {
        algorithm: 'HS256',
        expiresIn: this.jwtExpiresIn,
      },
    );
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, { algorithms: ['HS256'] });
      return {
        agentId: decoded.agentId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }
}

module.exports = JwtAuthService;
