# Security Guidelines

This document outlines security best practices for managing environment variables, credentials, and sensitive data in this Next.js application.

## Table of Contents

- [Understanding NEXT_PUBLIC_ Prefix](#understanding-next_public_-prefix)
- [Sensitive Credentials](#sensitive-credentials)
- [Environment Variable Security](#environment-variable-security)
- [Auditing Client Bundles](#auditing-client-bundles)
- [Credential Management Best Practices](#credential-management-best-practices)
- [Common Security Mistakes](#common-security-mistakes)
- [Incident Response](#incident-response)

---

## Understanding NEXT_PUBLIC_ Prefix

### How Next.js Handles Environment Variables

Next.js treats environment variables differently based on their prefix:

#### Server-Only Variables (No Prefix)

```bash
BACKEND_URL=https://api.example.com
SUPABASE_SERVICE_ROLE_KEY=secret-key-here
DATABASE_PASSWORD=super-secret
```

**Characteristics**:
- ✅ Only accessible in server-side code (API routes, server components)
- ✅ Never included in client-side JavaScript bundles
- ✅ Not accessible in browser DevTools or client code
- ✅ Safe for sensitive credentials

**Access**:
```typescript
// ✅ Works in API routes (src/app/api/**/route.ts)
export async function GET() {
  const backendUrl = process.env.BACKEND_URL; // Available
  // ...
}

// ❌ Does NOT work in client components
'use client';
export default function MyComponent() {
  const backendUrl = process.env.BACKEND_URL; // undefined
  // ...
}
```

#### Public Variables (NEXT_PUBLIC_ Prefix)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_API_VERSION=v1
NEXT_PUBLIC_FEATURE_FLAG=true
```

**Characteristics**:
- ⚠️ Embedded in client-side JavaScript at **build time**
- ⚠️ Visible to anyone who inspects your website
- ⚠️ Cannot be changed without rebuilding the application
- ✅ Accessible everywhere (client and server)
- ✅ Safe for non-sensitive configuration

**Access**:
```typescript
// ✅ Works everywhere
export default function MyComponent() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Available
  // ...
}
```

### Critical Rule

**NEVER prefix sensitive credentials with NEXT_PUBLIC_**

This will expose them to the entire internet!

---

## Sensitive Credentials

### What Qualifies as Sensitive?

Credentials that should **NEVER** be exposed to the browser:

- ❌ **Database passwords**
- ❌ **API secret keys**
- ❌ **Service role keys** (Supabase, Firebase, etc.)
- ❌ **Private encryption keys**
- ❌ **OAuth client secrets**
- ❌ **Webhook signing secrets**
- ❌ **Admin tokens**
- ❌ **Third-party API keys with write access**

### Supabase Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` is particularly dangerous because it:

- Bypasses all Row Level Security (RLS) policies
- Can read, write, and delete any data in your database
- Can modify database schema
- Can create and delete users
- Has full administrative access

**Correct Usage**:
```bash
# ✅ CORRECT - Server-only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# ❌ WRONG - Will expose to browser!
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Code Example**:
```typescript
// ✅ CORRECT - Use in API routes only
// src/app/api/admin/route.ts
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-only
  );
  
  // Perform admin operations
  const { data, error } = await supabase
    .from('users')
    .select('*');
    
  return Response.json({ data, error });
}
```

```typescript
// ❌ WRONG - Never use service role key in client components
'use client';
import { createClient } from '@supabase/supabase-js';

export default function MyComponent() {
  // This will fail (undefined) or expose the key if prefixed with NEXT_PUBLIC_
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // undefined in client
  );
  // ...
}
```

### Safe Public Credentials

These are safe to expose with `NEXT_PUBLIC_` prefix:

- ✅ **Supabase Anonymous Key** (respects RLS policies)
- ✅ **Public API endpoints**
- ✅ **Feature flags**
- ✅ **Public configuration values**
- ✅ **Analytics tracking IDs** (Google Analytics, etc.)
- ✅ **Public CDN URLs**

---

## Environment Variable Security

### Development vs Production

Always use different credentials for different environments:

```bash
# .env.local (Development)
BACKEND_URL=http://localhost:8080
SUPABASE_SERVICE_ROLE_KEY=dev-key-here

# Vercel Dashboard (Production)
BACKEND_URL=https://api.production.com
SUPABASE_SERVICE_ROLE_KEY=prod-key-here
```

**Benefits**:
- Limits blast radius if development credentials are compromised
- Prevents accidental production data modification during development
- Allows testing without affecting production

### Version Control

**Never commit sensitive files**:

```bash
# .gitignore should include:
.env*
!.env.example  # Template is safe to commit
```

**Verify before committing**:
```bash
# Check what will be committed
git status

# Ensure no .env.local or similar files are staged
git diff --cached

# If accidentally staged, remove from staging
git reset HEAD .env.local
```

### Credential Rotation

Rotate credentials regularly and immediately if compromised:

**Rotation Schedule**:
- Service role keys: Every 90 days
- API keys: Every 90 days
- Database passwords: Every 90 days
- After team member departure: Immediately
- After suspected breach: Immediately

**Rotation Process**:
1. Generate new credentials in the service (Supabase, backend, etc.)
2. Update environment variables in Vercel dashboard
3. Redeploy application
4. Verify new credentials work
5. Revoke old credentials
6. Update local `.env.local` files for all developers

---

## Auditing Client Bundles

### Why Audit?

Even with proper configuration, mistakes happen. Regular audits ensure no sensitive data leaks into client bundles.

### Manual Audit Process

#### Step 1: Build the Application

```bash
npm run build
```

#### Step 2: Search for Sensitive Strings

```bash
# Search for service role key pattern
grep -r "eyJhbGciOiJIUzI1NiIs" .next/static/

# Search for specific sensitive values (replace with your actual values)
grep -r "your-actual-service-role-key" .next/static/

# Search for backend URL patterns
grep -r "api.yourdomain.com" .next/static/

# Search for database passwords
grep -r "your-db-password" .next/static/
```

**Expected Result**: No matches found

**If matches found**: You have a security leak! Review your code for:
- Hardcoded credentials
- Incorrect use of `NEXT_PUBLIC_` prefix
- Accidental exposure in client components

#### Step 3: Inspect Bundle Analyzer

```bash
# Install bundle analyzer if not already installed
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

This opens a visual representation of your bundle. Look for:
- Unexpected large files
- Environment variable modules in client chunks
- Suspicious dependencies

### Automated Audit Script

Create a script to automate security checks:

```bash
# scripts/audit-security.sh
#!/bin/bash

echo "🔍 Running security audit..."

# Build the application
npm run build

# Define sensitive patterns to search for
PATTERNS=(
  "service_role"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_PASSWORD"
  "SECRET_KEY"
)

FOUND_ISSUES=0

for pattern in "${PATTERNS[@]}"; do
  echo "Checking for: $pattern"
  if grep -r "$pattern" .next/static/ > /dev/null 2>&1; then
    echo "❌ SECURITY ISSUE: Found '$pattern' in client bundle!"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
  fi
done

if [ $FOUND_ISSUES -eq 0 ]; then
  echo "✅ Security audit passed! No sensitive data found in client bundle."
  exit 0
else
  echo "❌ Security audit failed! Found $FOUND_ISSUES issue(s)."
  exit 1
fi
```

**Usage**:
```bash
chmod +x scripts/audit-security.sh
./scripts/audit-security.sh
```

### Browser DevTools Audit

1. Open your deployed application
2. Open DevTools (F12)
3. Go to Network tab
4. Reload the page
5. Filter by "JS" files
6. Open each JavaScript file
7. Search (Ctrl+F) for sensitive patterns:
   - Your service role key
   - Database passwords
   - API secret keys

---

## Credential Management Best Practices

### 1. Use Environment Variables, Not Hardcoded Values

```typescript
// ❌ WRONG - Hardcoded credentials
const apiKey = 'sk_live_abc123xyz';

// ✅ CORRECT - Use environment variables
const apiKey = process.env.API_SECRET_KEY;
```

### 2. Validate Environment Variables at Startup

```typescript
// src/lib/env.ts
import { z } from 'zod';

const serverSchema = z.object({
  BACKEND_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

// This will throw an error if variables are missing or invalid
export const serverEnv = serverSchema.parse(process.env);
```

### 3. Use Type-Safe Environment Access

```typescript
// ✅ CORRECT - Type-safe access
import { serverEnv } from '@/lib/env';

const backendUrl = serverEnv.BACKEND_URL; // TypeScript knows this exists

// ❌ WRONG - Direct access (no type safety)
const backendUrl = process.env.BACKEND_URL; // Could be undefined
```

### 4. Separate Concerns

```typescript
// ✅ CORRECT - Server-side admin operations
// src/app/api/admin/users/route.ts
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin access
  );
  // ...
}

// ✅ CORRECT - Client-side user operations
// src/components/UserProfile.tsx
'use client';
export default function UserProfile() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // User access
  );
  // ...
}
```

### 5. Implement Least Privilege

- Use anonymous keys for client-side operations
- Use service role keys only when necessary
- Implement Row Level Security (RLS) policies
- Create API routes as intermediaries instead of direct database access

### 6. Monitor and Log Access

```typescript
// Log admin operations for audit trail
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  console.log('[ADMIN] User deletion requested', {
    timestamp: new Date().toISOString(),
    // Don't log sensitive data
  });
  
  // Perform operation
  // ...
}
```

---

## Common Security Mistakes

### Mistake 1: Exposing Service Role Key

```bash
# ❌ WRONG
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=secret-key

# ✅ CORRECT
SUPABASE_SERVICE_ROLE_KEY=secret-key
```

### Mistake 2: Committing .env.local

```bash
# ❌ WRONG - Committing sensitive file
git add .env.local
git commit -m "Add environment variables"

# ✅ CORRECT - Verify .gitignore
cat .gitignore | grep ".env"
# Should show: .env*
```

### Mistake 3: Using Server Variables in Client Components

```typescript
// ❌ WRONG
'use client';
export default function MyComponent() {
  const apiKey = process.env.API_SECRET_KEY; // undefined
  // ...
}

// ✅ CORRECT - Use API route as intermediary
'use client';
export default function MyComponent() {
  const fetchData = async () => {
    const response = await fetch('/api/data'); // API route uses secret
    // ...
  };
  // ...
}
```

### Mistake 4: Logging Sensitive Data

```typescript
// ❌ WRONG
console.log('Service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ CORRECT
console.log('Service role key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

### Mistake 5: Sharing Credentials in Code Reviews

```typescript
// ❌ WRONG - Hardcoded in PR
const apiKey = 'sk_live_abc123xyz';

// ✅ CORRECT - Use environment variable
const apiKey = process.env.API_SECRET_KEY;
```

---

## Incident Response

### If Credentials Are Compromised

**Immediate Actions** (within 1 hour):

1. **Revoke compromised credentials**
   - Supabase: Dashboard → Settings → API → Reset service role key
   - Backend: Regenerate API keys
   - Database: Change passwords

2. **Generate new credentials**
   - Create new service role key
   - Create new API keys
   - Update all affected services

3. **Update environment variables**
   - Vercel Dashboard → Settings → Environment Variables
   - Update all environments (Production, Preview, Development)
   - Redeploy application

4. **Verify deployment**
   - Test application functionality
   - Verify new credentials work
   - Check logs for errors

**Investigation** (within 24 hours):

5. **Audit access logs**
   - Check Supabase logs for unauthorized access
   - Review backend API logs
   - Check Vercel deployment logs

6. **Identify breach source**
   - How were credentials exposed?
   - Git history? Public repository? Client bundle?
   - Team member error? Malicious actor?

7. **Document incident**
   - What happened?
   - When was it discovered?
   - What was the impact?
   - What actions were taken?

**Prevention** (within 1 week):

8. **Implement additional safeguards**
   - Add automated security audits to CI/CD
   - Implement credential rotation schedule
   - Add monitoring and alerting
   - Conduct team security training

9. **Review and update policies**
   - Update security guidelines
   - Improve onboarding documentation
   - Add pre-commit hooks for sensitive data detection

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. **Do NOT** discuss in public channels
3. **DO** contact the security team immediately
4. **DO** provide detailed information about the vulnerability
5. **DO** wait for acknowledgment before disclosing

---

## Security Checklist

Use this checklist before every deployment:

- [ ] All sensitive credentials use server-only variables (no `NEXT_PUBLIC_` prefix)
- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] Different credentials for development and production
- [ ] Environment variables validated at build time
- [ ] Client bundle audited for sensitive data leaks
- [ ] Service role key is not accessible in browser DevTools
- [ ] API routes properly authenticate requests
- [ ] Row Level Security (RLS) policies are enabled in Supabase
- [ ] Error messages don't expose sensitive information
- [ ] Logging doesn't include sensitive data
- [ ] Team members have appropriate access levels
- [ ] Credential rotation schedule is documented

---

## Additional Resources

- [Next.js Environment Variables Documentation](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security Documentation](https://vercel.com/docs/security)

---

**Last Updated**: January 2026

**Remember**: Security is everyone's responsibility. When in doubt, ask!
