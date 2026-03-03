/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/infrastructure/config/env.js',
    '!src/infrastructure/database/connection.js',
    '!src/infrastructure/database/repositories/**',
    '!src/infrastructure/database/models/**',
    '!src/infrastructure/ai/GeminiTriageService.js',
    '!src/infrastructure/ai/RetryHandler.js',
    '!src/infrastructure/auth/JwtAuthService.js',
    '!src/interfaces/repositories/**',
    '!src/interfaces/services/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'text-summary', 'lcov'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  verbose: true,
};
