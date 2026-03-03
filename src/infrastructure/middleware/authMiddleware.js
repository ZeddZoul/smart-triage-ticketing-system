const { UnauthorizedError } = require('../../entities/errors');

function authMiddleware(authService) {
  return async function auth(req, _res, next) {
    try {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw new UnauthorizedError('Missing or invalid Authorization header');
      }

      const payload = await authService.verifyToken(token);
      req.agent = payload;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = authMiddleware;
