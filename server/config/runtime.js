'use strict';
function validateRuntime(env = process.env) {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (env.NODE_ENV === 'production' && (env.CORS_ORIGINS || '').includes('*')) throw new Error('Wildcard CORS is forbidden in production');
}
module.exports = { validateRuntime };
