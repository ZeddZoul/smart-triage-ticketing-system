/**
 * Seed Script — Creates a default agent account for testing.
 *
 * Usage:
 *   node src/scripts/seed.js
 *
 * Requires: MONGODB_URI and JWT_SECRET env vars (or .env file).
 */

const dotenv = require('dotenv');
dotenv.config();

const { connectDatabase, disconnectDatabase } = require('../infrastructure/database/connection');
const { loadConfig } = require('../infrastructure/config/env');
const JwtAuthService = require('../infrastructure/auth/JwtAuthService');
const MongoAgentRepository = require('../infrastructure/database/repositories/MongoAgentRepository');
const RegisterAgentUseCase = require('../useCases/RegisterAgentUseCase');

const DEFAULT_AGENT = {
  email: 'agent@smarttriage.com',
  password: 'password123',
  name: 'Default Agent',
};

async function seed() {
  const config = loadConfig();
  await connectDatabase(config.mongodbUri);

  const authService = new JwtAuthService(config.jwtSecret, config.jwtExpiresIn, config.bcryptSaltRounds);
  const agentRepository = new MongoAgentRepository();
  const registerAgent = new RegisterAgentUseCase(agentRepository, authService);

  try {
    const agent = await registerAgent.execute(DEFAULT_AGENT);
    console.log('✅ Default agent created:');
    console.log(`   Email:    ${DEFAULT_AGENT.email}`);
    console.log(`   Password: ${DEFAULT_AGENT.password}`);
    console.log(`   Name:     ${agent.name}`);
    console.log(`   Role:     ${agent.role}`);
    console.log(`   ID:       ${agent.id}`);
  } catch (err) {
    if (err.code === 'CONFLICT') {
      console.log('ℹ️  Default agent already exists, skipping.');
    } else {
      console.error('❌ Seed failed:', err.message);
      process.exit(1);
    }
  }

  await disconnectDatabase();
  console.log('🌱 Seed complete.');
}

seed();
