/**
 * Jest Global Setup — tests/setup.js
 *
 * Global test environment configuration.
 * Runs before all tests.
 *
 * @see DESIGN.md §14 (Test Strategy)
 */

// Set environment to test mode
process.env.NODE_ENV = 'test';

// Default environment variables for test mode
if (!process.env.PORT) process.env.PORT = '3000';
if (!process.env.MONGODB_URI) process.env.MONGODB_URI = 'mongodb://localhost:27017/smart-triage-test';
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-jwt-secret-key';
if (!process.env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = 'test-gemini-key';
if (!process.env.CORS_ORIGIN) process.env.CORS_ORIGIN = 'http://localhost:3001';

// Suppress console logs during tests (optional)
// global.console.log = jest.fn();
// global.console.warn = jest.fn();
// global.console.error = jest.fn();
