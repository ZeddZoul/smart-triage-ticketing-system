/**
 * Configuration Management — env.js
 *
 * Responsibilities:
 *   1. Load environment variables via process.env (dotenv loaded in server.js)
 *   2. Validate required vars are present (fail fast on startup)
 *   3. Apply defaults for optional vars
 *   4. Export a frozen config object
 *
 * @see DESIGN.md §13 — Configuration Management
 * @see REQUIREMENTS.md §5.1 — Backend Environment Variables
 */

const { z } = require('zod');

const envSchema = z.object({
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),

  JWT_EXPIRES_IN: z.string().default('24h'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),

  MAX_TRIAGE_RETRIES: z
    .string()
    .default('3')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0).max(10)),

  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  BCRYPT_SALT_ROUNDS: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(4).max(20)),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Parse and validate environment variables.
 * Throws a descriptive error on startup if required vars are missing.
 */
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  const env = result.data;

  return Object.freeze({
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    mongodbUri: env.MONGODB_URI,
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL,
    maxTriageRetries: env.MAX_TRIAGE_RETRIES,
    corsOrigin: env.CORS_ORIGIN,
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    logLevel: env.LOG_LEVEL,
  });
}

module.exports = { loadConfig };
