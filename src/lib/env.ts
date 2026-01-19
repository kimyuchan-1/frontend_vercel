import { z } from 'zod';

// Server-side environment schema
// These variables are only accessible in server-side code (API routes, server components)
const serverSchema = z.object({
  BACKEND_URL: z.string().url('BACKEND_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Client-side environment schema
// These variables are prefixed with NEXT_PUBLIC_ and are exposed to the browser
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
});

// List of sensitive environment variable names that should NEVER have NEXT_PUBLIC_ prefix
const SENSITIVE_KEYS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SERVICE_ROLE_KEY',
  'ADMIN_KEY',
  'SECRET_KEY',
  'PRIVATE_KEY',
  'API_SECRET',
  'DATABASE_URL',
  'DB_PASSWORD',
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
] as const;

// Security check: Detect if sensitive credentials are accidentally exposed with NEXT_PUBLIC_ prefix
function validateSecurity() {
  const violations: string[] = [];
  
  // Check each sensitive key pattern
  for (const sensitiveKey of SENSITIVE_KEYS) {
    const publicKey = `NEXT_PUBLIC_${sensitiveKey}`;
    if (process.env[publicKey]) {
      violations.push(publicKey);
    }
  }
  
  // Also check for any environment variable containing sensitive patterns
  const sensitivePatterns = ['SECRET', 'PRIVATE', 'PASSWORD', 'KEY', 'TOKEN'];
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      const keyUpper = key.toUpperCase();
      for (const pattern of sensitivePatterns) {
        if (keyUpper.includes(pattern) && !violations.includes(key)) {
          // Skip known safe public variables
          if (key === 'NEXT_PUBLIC_SUPABASE_URL' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
            continue;
          }
          violations.push(key);
          break;
        }
      }
    }
  }
  
  if (violations.length > 0) {
    throw new Error(
      '\n❌ SECURITY ERROR: Sensitive credentials detected with NEXT_PUBLIC_ prefix!\n' +
      '   The following variables will be exposed to the browser:\n' +
      violations.map(v => `   - ${v}`).join('\n') + '\n' +
      '\n   This is a critical security vulnerability!\n' +
      '   Remove the NEXT_PUBLIC_ prefix from these variables immediately.\n' +
      '   Sensitive credentials should only be accessible server-side.\n'
    );
  }
}

// Validate and export server environment
export const serverEnv = serverSchema.parse({
  BACKEND_URL: process.env.BACKEND_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NODE_ENV: process.env.NODE_ENV,
});

// Validate and export client environment
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
});

// Run security validation
validateSecurity();

// Type exports for IDE autocomplete
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
