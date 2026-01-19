#!/usr/bin/env tsx
import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Define the same schemas as in src/lib/env.ts for validation
const serverSchema = z.object({
  BACKEND_URL: z.string().url('BACKEND_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
});

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function validateEnvironment() {
  console.log(`${colors.cyan}${colors.bold}🔍 Validating environment variables...${colors.reset}\n`);
  
  let hasErrors = false;
  
  // Security check: Detect if sensitive credentials are exposed with NEXT_PUBLIC_ prefix
  const sensitiveKeys = [
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
  ];
  
  const violations: string[] = [];
  
  // Check each sensitive key pattern
  for (const sensitiveKey of sensitiveKeys) {
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
    console.error(`${colors.red}${colors.bold}❌ SECURITY ERROR: Sensitive credentials detected with NEXT_PUBLIC_ prefix!${colors.reset}`);
    console.error(`${colors.red}   The following variables will be exposed to the browser:${colors.reset}`);
    violations.forEach(v => console.error(`${colors.red}   - ${v}${colors.reset}`));
    console.error(`${colors.red}\n   This is a critical security vulnerability!${colors.reset}`);
    console.error(`${colors.red}   Remove the NEXT_PUBLIC_ prefix from these variables immediately.${colors.reset}`);
    console.error(`${colors.red}   Sensitive credentials should only be accessible server-side.${colors.reset}\n`);
    hasErrors = true;
  }
  
  // Validate server environment variables
  try {
    const serverEnv = serverSchema.parse({
      BACKEND_URL: process.env.BACKEND_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });
    
    console.log(`${colors.green}✅ Server environment variables:${colors.reset}`);
    console.log(`   ${colors.cyan}BACKEND_URL:${colors.reset} ${serverEnv.BACKEND_URL}`);
    console.log(`   ${colors.cyan}SUPABASE_SERVICE_ROLE_KEY:${colors.reset} ${serverEnv.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...`);
    console.log(`   ${colors.cyan}NODE_ENV:${colors.reset} ${serverEnv.NODE_ENV}`);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error(`${colors.red}${colors.bold}❌ Server environment validation failed:${colors.reset}`);
      error.issues.forEach((err) => {
        console.error(`${colors.red}   ${err.path.join('.')}: ${err.message}${colors.reset}`);
      });
      hasErrors = true;
    } else {
      console.error(`${colors.red}${colors.bold}❌ Server environment validation failed:${colors.reset}`);
      console.error(`${colors.red}   ${error}${colors.reset}`);
      hasErrors = true;
    }
  }
  
  // Validate client environment variables
  try {
    const clientEnv = clientSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    });
    
    console.log(`\n${colors.green}✅ Client environment variables:${colors.reset}`);
    console.log(`   ${colors.cyan}NEXT_PUBLIC_SUPABASE_URL:${colors.reset} ${clientEnv.NEXT_PUBLIC_SUPABASE_URL}`);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error(`\n${colors.red}${colors.bold}❌ Client environment validation failed:${colors.reset}`);
      error.issues.forEach((err) => {
        console.error(`${colors.red}   ${err.path.join('.')}: ${err.message}${colors.reset}`);
      });
      hasErrors = true;
    } else {
      console.error(`\n${colors.red}${colors.bold}❌ Client environment validation failed:${colors.reset}`);
      console.error(`${colors.red}   ${error}${colors.reset}`);
      hasErrors = true;
    }
  }
  
  // Final result
  if (hasErrors) {
    console.error(`\n${colors.red}${colors.bold}❌ Environment validation failed!${colors.reset}`);
    console.error(`${colors.yellow}💡 Check your .env.local file or Vercel environment variables.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ Environment validation passed!${colors.reset}`);
    console.log(`${colors.green}   All required environment variables are present and valid.${colors.reset}\n`);
    process.exit(0);
  }
}

// Run validation
validateEnvironment();
