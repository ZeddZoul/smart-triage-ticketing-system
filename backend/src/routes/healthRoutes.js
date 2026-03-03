const express = require('express');

function createHealthRoutes() {
  const router = express.Router();

  router.get('/', (_req, res) => {
    return res.status(200).json({
      status: 'ok',
      service: 'smart-triage-api',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = createHealthRoutes;
