import 'dotenv/config';

const requiredEnvVars = ['PORT', 'DATABASE_URL', 'JWT_SECRET'] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
