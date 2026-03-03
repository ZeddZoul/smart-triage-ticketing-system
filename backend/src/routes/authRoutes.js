const express = require('express');
const { registerAgentSchema, loginSchema } = require('../infrastructure/validators/authValidators');

function createAuthRoutes(deps) {
  const router = express.Router();
  const { authController, validationMiddleware } = deps;

  router.post('/register', validationMiddleware(registerAgentSchema, 'body'), authController.register);
  router.post('/login', validationMiddleware(loginSchema, 'body'), authController.login);

  return router;
}

module.exports = createAuthRoutes;
