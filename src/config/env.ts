import 'dotenv/config';

const requiredEnvVars = ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'AWS_S3_EXPIRESIN', 'AWS_S3_BUCKET', 'AWS_S3_SECRET_ACCESS_KEY', 'AWS_S3_ACCESS_KEY_ID', 'AWS_S3_REGION'] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
