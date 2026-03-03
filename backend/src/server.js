require('dotenv').config();

const { createApp } = require('./app');
const {
  connectDatabase,
  registerDatabaseShutdownHandlers,
} = require('./infrastructure/database/connection');
const { loadConfig } = require('./infrastructure/config/env');

async function startServer() {
  const config = loadConfig();

  await connectDatabase(config.mongodbUri);
  registerDatabaseShutdownHandlers(console);

  const app = createApp({ config });

  const server = app.listen(config.port, () => {
    console.info(`API listening on port ${config.port}`);
  });

  const shutdown = (signal) => {
    console.info(`Received ${signal}. Shutting down HTTP server...`);
    server.close(() => {
      console.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

module.exports = {
  startServer,
};
