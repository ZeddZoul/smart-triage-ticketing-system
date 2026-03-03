const express = require('express');
const { createTicketSchema, updateTicketStatusSchema, ticketQuerySchema } = require('../infrastructure/validators/ticketValidators');

function createTicketRoutes(deps) {
  const router = express.Router();
  const { ticketController, authMiddleware, validationMiddleware } = deps;

  router.post('/', validationMiddleware(createTicketSchema, 'body'), ticketController.create);

  router.get(
    '/',
    authMiddleware,
    validationMiddleware(ticketQuerySchema, 'query'),
    ticketController.getAll,
  );

  router.get('/:id', authMiddleware, ticketController.getById);

  router.patch(
    '/:id',
    authMiddleware,
    validationMiddleware(updateTicketStatusSchema, 'body'),
    ticketController.updateStatus,
  );

  router.post('/:id/retriage', authMiddleware, ticketController.retriage);

  return router;
}

module.exports = createTicketRoutes;
