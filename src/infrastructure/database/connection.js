const mongoose = require('mongoose');

async function connectDatabase(mongodbUri) {
  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required for database connection');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongodbUri, {
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

function registerDatabaseShutdownHandlers(logger = console) {
  const shutdown = async (signal) => {
    try {
      await disconnectDatabase();
      logger.info?.(`MongoDB connection closed (${signal})`);
      process.exit(0);
    } catch (err) {
      logger.error?.('Error during MongoDB shutdown', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  registerDatabaseShutdownHandlers,
};
