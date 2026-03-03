const express = require('express');
const cors = require('cors');

const { createContainer } = require('./container');
const createTicketRoutes = require('./routes/ticketRoutes');
const createAuthRoutes = require('./routes/authRoutes');
const createHealthRoutes = require('./routes/healthRoutes');
const errorMiddleware = require('./infrastructure/middleware/errorMiddleware');

function createApp(overrides = {}) {
  const container = overrides.container || createContainer(overrides);

  const app = express();
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: container.config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use('/api/health', createHealthRoutes());
  app.use(
    '/api/tickets',
    createTicketRoutes({
      ticketController: container.controllers.ticketController,
      authMiddleware: container.middleware.authMiddleware,
      validationMiddleware: container.middleware.validationMiddleware,
    }),
  );
  app.use(
    '/api/auth',
    createAuthRoutes({
      authController: container.controllers.authController,
      validationMiddleware: container.middleware.validationMiddleware,
    }),
  );

  app.use(errorMiddleware);

  return app;
}

module.exports = {
  createApp,
};
