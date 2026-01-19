# Deployment Guide: Vercel Deployment

This guide provides step-by-step instructions for deploying this Next.js application to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables Overview](#environment-variables-overview)
- [Local Development Setup](#local-development-setup)
- [Deploying to Vercel](#deploying-to-vercel)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [API Route Timeout Configuration](#api-route-timeout-configuration)
- [Security Best Practices](#security-best-practices)
- [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

Before deploying to Vercel, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you don't have an account
2. **Production Backend URL**: Your backend API must be deployed and accessible via HTTPS
3. **Supabase Project**: A Supabase project with the necessary database setup
4. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
5. **Node.js**: Version 18.x or higher installed locally for testing

### Required Credentials

Gather the following credentials before starting:

- **Backend API URL** (production): e.g., `https://api.yourdomain.com`
- **Supabase Project URL**: Found in Supabase Dashboard → Settings → API
- **Supabase Service Role Key**: Found in Supabase Dashboard → Settings → API (keep this secret!)

---

## Environment Variables Overview

This application uses environment variables to configure different environments without code changes.

### Variable Types

**Server-Only Variables** (No `NEXT_PUBLIC_` prefix):
- Only accessible in API routes and server components
- Never exposed to the browser
- Used for sensitive credentials

**Public Variables** (`NEXT_PUBLIC_` prefix):
- Embedded in the client-side JavaScript bundle at build time
- Accessible everywhere (client and server)
- Safe for browser exposure

### Required Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `BACKEND_URL` | Server-Only | Backend API base URL | `https://api.yourdomain.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Supabase admin key (⚠️ sensitive) | `eyJhbGciOiJIUzI1NiIs...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | `https://abcd.supabase.co` |
| `NODE_ENV` | Server-Only | Runtime environment (optional) | `production` |

---

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-project-directory>

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your development values
# Use your preferred text editor
```

Example `.env.local` for development:

```bash
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NODE_ENV=development
```

### Step 3: Validate Configuration

```bash
# Run environment validation (if available)
npm run validate:env

# Start development server
npm run dev
```

Visit `http://localhost:3000` to verify the application runs correctly.

---

## Pre-Deployment Checklist

Before deploying to Vercel, complete this checklist to ensure a smooth deployment:

### 1. Environment Configuration

- [ ] All required environment variables are documented in `.env.example`
- [ ] `.env.local` is properly configured for local development
- [ ] `.gitignore` includes all `.env*` files (except `.env.example`)
- [ ] No sensitive credentials are committed to version control
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `BACKEND_URL` is set to production URL (not localhost)

### 2. Validation Commands

Run these commands to validate your configuration:

```bash
# Validate environment variables
npm run validate:env
# Expected output: ✅ Environment validation passed!

# Run TypeScript type checking
npm run type-check
# Expected output: No type errors

# Run linting
npm run lint
# Expected output: No linting errors

# Run tests (if available)
npm test
# Expected output: All tests passing
```

### 3. Production Build Test

Test the production build locally before deploying:

```bash
# Create a temporary production environment file
cp .env.local .env.production.local

# Edit .env.production.local with production values
# IMPORTANT: Use production BACKEND_URL

# Build with production environment
npm run build
# Expected output: Build completed successfully

# Check build output
ls -la .next/
# Verify .next directory exists with static/ and server/ folders
```

### 4. Security Verification

Verify no sensitive credentials are exposed in the client bundle:

```bash
# Search for sensitive keys in client bundle
# Replace 'your-service-role-key-prefix' with first 20 chars of your key
grep -r "your-service-role-key-prefix" .next/static/

# Expected output: No matches found (empty result)
# If matches found: STOP and fix the security issue before deploying!
```

### 5. Vercel Dashboard Preparation

Prepare the following information for Vercel configuration:

- [ ] Production `BACKEND_URL` (e.g., `https://api.yourdomain.com`)
- [ ] Production `NEXT_PUBLIC_SUPABASE_URL` (from Supabase dashboard)
- [ ] Production `SUPABASE_SERVICE_ROLE_KEY` (from Supabase dashboard)
- [ ] Vercel account credentials ready
- [ ] Git repository connected to Vercel (or ready to connect)

### 6. Backend API Verification

Ensure your backend API is ready:

- [ ] Backend API is deployed and accessible via HTTPS
- [ ] Backend API health endpoint responds correctly
- [ ] CORS is configured to allow requests from Vercel domain
- [ ] Backend API can handle expected production load

Test backend connectivity:

```bash
# Test backend health endpoint
curl https://your-production-backend-url/health

# Expected output: 200 OK with health status
```

### 7. Documentation Review

- [ ] `DEPLOYMENT.md` is up to date
- [ ] `SECURITY.md` guidelines are reviewed
- [ ] `.env.example` contains all required variables
- [ ] Team members are informed about deployment

### 8. Final Checks

- [ ] All code changes are committed and pushed to Git
- [ ] Working branch is merged to main/production branch
- [ ] No uncommitted changes in working directory
- [ ] Latest changes are tested locally

```bash
# Verify clean working directory
git status
# Expected output: "nothing to commit, working tree clean"

# Verify on correct branch
git branch
# Expected output: * main (or your production branch)
```

### Pre-Deployment Checklist Summary

Once all items above are checked:

✅ **Ready to Deploy** - Proceed to [Deploying to Vercel](#deploying-to-vercel)

❌ **Not Ready** - Address any unchecked items before deploying

---

## Deploying to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended for First Deployment)

#### Step 1: Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Vercel to access your repositories
5. Select the repository containing this project

#### Step 2: Configure Project

1. **Framework Preset**: Vercel should auto-detect "Next.js"
2. **Root Directory**: Leave as `.` (unless your Next.js app is in a subdirectory)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)

#### Step 3: Configure Environment Variables

In the "Environment Variables" section, add the following:

1. **BACKEND_URL**
   - Key: `BACKEND_URL`
   - Value: Your production backend URL (e.g., `https://api.yourdomain.com`)
   - Environment: Production (and optionally Preview)

2. **NEXT_PUBLIC_SUPABASE_URL**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase project URL
   - Environment: Production (and optionally Preview)

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your Supabase service role key
   - Environment: Production (and optionally Preview)
   - ⚠️ **CRITICAL**: Do NOT prefix this with `NEXT_PUBLIC_`

4. **NODE_ENV** (Optional)
   - Key: `NODE_ENV`
   - Value: `production`
   - Environment: Production

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete (typically 2-5 minutes)
3. Vercel will provide a deployment URL (e.g., `your-app.vercel.app`)

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

When prompted, configure environment variables:

```bash
? Set up "BACKEND_URL"? [y/N] y
? What's the value of BACKEND_URL? https://api.yourdomain.com

? Set up "NEXT_PUBLIC_SUPABASE_URL"? [y/N] y
? What's the value of NEXT_PUBLIC_SUPABASE_URL? https://your-project.supabase.co

? Set up "SUPABASE_SERVICE_ROLE_KEY"? [y/N] y
? What's the value of SUPABASE_SERVICE_ROLE_KEY? your-service-role-key-here
```

### Method 3: Deploy via Git Integration (Continuous Deployment)

Once your project is connected to Vercel:

1. Push changes to your Git repository
2. Vercel automatically detects the push
3. Builds and deploys the new version
4. Each branch gets its own preview URL

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## Post-Deployment Verification

After deployment completes, follow these verification steps to ensure everything works correctly:

### Step 1: Check Deployment Status

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Check the latest deployment:
   - [ ] Status shows "Ready" (green checkmark)
   - [ ] Build logs show no errors
   - [ ] Deployment URL is accessible

**If deployment failed:**
- Review build logs for error messages
- Check [Troubleshooting](#troubleshooting) section
- Verify environment variables are set correctly

### Step 2: Verify Environment Variables

Confirm all environment variables are properly configured:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify the following variables exist:
   - [ ] `BACKEND_URL` (Production environment)
   - [ ] `NEXT_PUBLIC_SUPABASE_URL` (Production environment)
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Production environment)
   - [ ] No variables with `NEXT_PUBLIC_` prefix contain sensitive data

**Check variable values:**
```bash
# In Vercel Dashboard, click "eye" icon to reveal values
# Verify:
# - BACKEND_URL starts with https:// (not http://localhost)
# - URLs have no typos or extra spaces
# - Keys are complete (not truncated)
```

### Step 3: Test Application Functionality

Visit your deployment URL (e.g., `https://your-app.vercel.app`) and test core functionality:

#### Basic Functionality Checks

- [ ] Application loads without errors (no blank page)
- [ ] Homepage renders correctly
- [ ] Navigation works (all links functional)
- [ ] Images and assets load properly
- [ ] No console errors in browser DevTools (F12 → Console tab)

#### API Connectivity Checks

Test that API routes can connect to your backend:

1. Open browser DevTools (F12) → Network tab
2. Perform actions that trigger API calls (e.g., login, fetch data)
3. Check API requests:
   - [ ] API requests complete successfully (200 status codes)
   - [ ] No CORS errors
   - [ ] Response data is correct
   - [ ] No timeout errors

**Manual API test:**
```javascript
// Open browser console on your deployed site
// Test a sample API endpoint
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err));

// Expected: Successful response with health status
// If error: Check backend connectivity and CORS configuration
```

#### Authentication Checks

If your app has authentication:

- [ ] Sign-up flow works correctly
- [ ] Login flow works correctly
- [ ] Session persistence works (refresh page while logged in)
- [ ] Logout works correctly
- [ ] Protected routes redirect unauthenticated users

#### Data Operations Checks

- [ ] Data fetching from backend works
- [ ] Create operations work (if applicable)
- [ ] Update operations work (if applicable)
- [ ] Delete operations work (if applicable)
- [ ] Error handling displays appropriate messages

### Step 4: Security Audit - Verify No Credential Leaks

**CRITICAL**: This step ensures sensitive credentials are not exposed to the browser.

#### Method 1: Browser DevTools Inspection

1. Open your deployed site in a browser
2. Open DevTools (F12) → Network tab
3. Reload the page (Ctrl+R or Cmd+R)
4. Look for JavaScript files (`.js` files in the list)
5. Click on main JavaScript bundles (e.g., `main-*.js`, `app-*.js`)
6. Use browser search (Ctrl+F) to search for:
   - [ ] Your `SUPABASE_SERVICE_ROLE_KEY` (search for first 20 characters)
   - [ ] The word "service_role" or "service-role"
   - [ ] Your backend API URL (should NOT appear in client bundles)

**Expected Result**: No matches found for sensitive credentials

**If credentials found**: 
- ⚠️ **SECURITY BREACH** - Immediately revoke compromised credentials
- Check that sensitive variables don't have `NEXT_PUBLIC_` prefix
- Redeploy after fixing

#### Method 2: Automated Bundle Check

```bash
# Download and check production bundles locally
# Replace with your actual deployment URL
curl https://your-app.vercel.app/_next/static/chunks/main-*.js > bundle.js

# Search for sensitive data
grep -i "service.role" bundle.js
grep -i "your-backend-url" bundle.js

# Expected output: No matches (empty result)
```

#### Method 3: Environment Variable Accessibility Test

Test that server variables are NOT accessible in the browser:

```javascript
// Open browser console on your deployed site
console.log('BACKEND_URL:', process.env.BACKEND_URL);
// Expected: undefined (correct - server-only variable)

console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);
// Expected: undefined (correct - server-only variable)

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
// Expected: Your Supabase URL (correct - public variable)
```

### Step 5: Performance Verification

Check that the application performs well in production:

#### Load Time Checks

1. Open DevTools → Network tab
2. Reload page with cache disabled (Ctrl+Shift+R)
3. Check metrics:
   - [ ] Initial page load < 3 seconds
   - [ ] Time to Interactive (TTI) < 5 seconds
   - [ ] No excessively large bundles (> 1MB)

#### Lighthouse Audit

Run a Lighthouse audit for production quality:

1. Open DevTools → Lighthouse tab
2. Select "Performance" and "Best Practices"
3. Click "Analyze page load"
4. Review scores:
   - [ ] Performance score > 70
   - [ ] Best Practices score > 80
   - [ ] No critical security issues

### Step 6: Backend Integration Verification

Verify the frontend correctly communicates with your production backend:

#### Test Backend Connectivity

```bash
# Test from command line
curl -X GET https://your-app.vercel.app/api/health

# Expected: 200 OK response
```

#### Check Backend Logs

1. Access your backend server logs
2. Verify requests from Vercel are being received
3. Check for any errors or warnings
4. Confirm CORS headers are working

#### Test Data Flow

- [ ] Frontend can fetch data from backend
- [ ] Frontend can send data to backend
- [ ] Authentication tokens are properly forwarded
- [ ] Error responses are handled gracefully

### Step 7: Cross-Browser Testing

Test on multiple browsers to ensure compatibility:

- [ ] Chrome/Edge (Chromium-based)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (Chrome Mobile, Safari iOS)

### Step 8: Error Monitoring Setup

Set up error monitoring to catch issues in production:

1. If using error tracking (Sentry, LogRocket, etc.):
   - [ ] Error tracking is configured
   - [ ] Test errors are being captured
   - [ ] Alerts are configured

2. Check Vercel logs:
   - Go to Vercel Dashboard → Your Project → Logs
   - [ ] No unexpected errors in logs
   - [ ] API routes are logging correctly

### Step 9: DNS and Domain Configuration (If Using Custom Domain)

If you've configured a custom domain:

- [ ] DNS records are properly configured
- [ ] SSL certificate is active (HTTPS works)
- [ ] Domain redirects work correctly (www → non-www or vice versa)
- [ ] No mixed content warnings

### Step 10: Documentation and Team Notification

- [ ] Update internal documentation with deployment URL
- [ ] Notify team members of successful deployment
- [ ] Share any important notes or changes
- [ ] Update project README with production URL (if applicable)

### Post-Deployment Verification Summary

✅ **All checks passed** - Deployment successful! Monitor for any issues.

⚠️ **Some checks failed** - Review failed items and address issues:
- Minor issues: Monitor and fix in next deployment
- Critical issues: Consider rollback (see [Rollback Procedures](#rollback-procedures))

❌ **Critical failures** - Immediate action required:
- Security issues: Rollback immediately and fix
- Application not loading: Rollback and investigate
- Data loss or corruption: Rollback and restore from backup

---

## Troubleshooting

### Build Failures

#### Error: "Missing required environment variables"

**Cause**: Required environment variables are not set in Vercel dashboard.

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables (see [Required Variables](#required-variables))
3. Redeploy: Deployments → ⋯ → Redeploy

#### Error: "Invalid URL format"

**Cause**: Environment variable contains an invalid URL.

**Solution**:
1. Verify URLs start with `http://` or `https://`
2. Check for typos or extra spaces
3. Ensure no trailing slashes unless required

#### Error: "SECURITY ERROR: SUPABASE_SERVICE_ROLE_KEY is prefixed with NEXT_PUBLIC_"

**Cause**: Service role key is accidentally exposed as a public variable.

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
3. Delete it
4. Add `SUPABASE_SERVICE_ROLE_KEY` (without `NEXT_PUBLIC_` prefix)
5. Redeploy

### Runtime Errors

#### Error: "Backend API unavailable"

**Cause**: Frontend cannot connect to backend API.

**Solution**:
1. Verify `BACKEND_URL` is correct in Vercel dashboard
2. Ensure backend API is running and accessible via HTTPS
3. Check CORS configuration on backend allows requests from Vercel domain
4. Test backend API directly: `curl https://your-backend-url/health`

#### Error: "Supabase connection failed"

**Cause**: Supabase credentials are incorrect or project is not accessible.

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project
2. Check `SUPABASE_SERVICE_ROLE_KEY` is correct (copy from Supabase dashboard)
3. Ensure Supabase project is not paused (free tier limitation)
4. Check Supabase project settings for any IP restrictions

### Performance Issues

#### Slow API Responses

**Cause**: API routes timing out or backend is slow.

**Solution**:
1. Check `vercel.json` has appropriate timeout settings (see [API Route Timeout Configuration](#api-route-timeout-configuration))
2. Optimize backend API performance
3. Consider adding caching layers
4. Monitor backend API response times

#### Large Bundle Size

**Cause**: Too many dependencies or large assets.

**Solution**:
```bash
# Analyze bundle size
npm run build
ANALYZE=true npm run build

# Check for large dependencies
npm install -g webpack-bundle-analyzer
```

---

## API Route Timeout Configuration

Vercel has default timeout limits for API routes that vary by plan:
- **Hobby Plan**: 10 seconds
- **Pro Plan**: 15 seconds (can be increased to 60s)
- **Enterprise Plan**: 15 seconds (can be increased to 900s)

If your API routes need more time to process requests (e.g., proxying to a slow backend), you have two options:

### Option 1: Global Configuration via `vercel.json` (Recommended)

This project includes a `vercel.json` file that sets a 30-second timeout for all API routes:

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Pros**:
- Applies to all API routes automatically
- Single configuration point
- Easy to maintain

**Cons**:
- Same timeout for all routes
- Requires redeployment to change

### Option 2: Per-Route Configuration (Next.js App Router)

For Next.js 16 with App Router, you can set timeouts on individual route files:

```typescript
// src/app/api/slow-endpoint/route.ts
export const maxDuration = 30; // 30 seconds

export async function GET(request: Request) {
  // Your slow API logic here
}
```

**Pros**:
- Fine-grained control per route
- Can optimize timeouts based on route needs
- No separate config file needed

**Cons**:
- Must be added to each route file
- Easy to forget for new routes

### When to Use Each Approach

**Use `vercel.json`** when:
- Most of your API routes need the same timeout
- You want a consistent timeout policy across all routes
- You prefer centralized configuration

**Use per-route configuration** when:
- Different routes have significantly different timeout needs
- You want to optimize timeouts for specific endpoints
- You're migrating from Pages Router and want route-level control

### Timeout Best Practices

1. **Set realistic timeouts**: Don't set unnecessarily long timeouts
2. **Optimize backend calls**: Reduce the need for long timeouts by optimizing backend performance
3. **Use streaming**: For long-running operations, consider streaming responses
4. **Implement retries**: Add retry logic for transient failures
5. **Monitor timeout errors**: Track which routes are timing out and why

### Verifying Timeout Configuration

After deployment, you can verify timeout settings:

1. Check Vercel Dashboard → Your Project → Settings → Functions
2. Look for "Max Duration" settings
3. Test slow endpoints to ensure they don't timeout prematurely

---

## Security Best Practices

### 1. Environment Variable Management

- ✅ **DO**: Use server-only variables for sensitive data
- ✅ **DO**: Rotate credentials regularly
- ✅ **DO**: Use different credentials for development and production
- ❌ **DON'T**: Prefix sensitive keys with `NEXT_PUBLIC_`
- ❌ **DON'T**: Commit `.env.local` to version control
- ❌ **DON'T**: Share credentials in public forums or logs

### 2. Credential Rotation

If credentials are compromised:

1. **Immediately** revoke the compromised credentials in Supabase/backend
2. Generate new credentials
3. Update environment variables in Vercel dashboard
4. Redeploy the application
5. Audit logs for unauthorized access

### 3. Access Control

- Limit who has access to Vercel project settings
- Use Vercel Teams for better access management
- Enable two-factor authentication on Vercel account
- Regularly audit team member access

### 4. Monitoring

- Set up error tracking (e.g., Sentry, LogRocket)
- Monitor API usage for unusual patterns
- Set up alerts for deployment failures
- Review Vercel logs regularly

---

## Rollback Procedures

If a deployment causes issues or breaks functionality, follow these procedures to rollback to a stable version.

### When to Rollback

Consider rollback if you encounter:

- **Critical Issues** (Immediate rollback required):
  - Application completely broken or not loading
  - Security vulnerability exposed
  - Data corruption or loss
  - Authentication system failure
  - Payment processing errors

- **Major Issues** (Rollback recommended):
  - Core features not working
  - Widespread user-reported errors
  - Performance degradation > 50%
  - API connectivity failures

- **Minor Issues** (Monitor, rollback optional):
  - Non-critical feature bugs
  - UI/UX issues
  - Minor performance issues
  - Cosmetic problems

### Rollback Method 1: Quick Rollback via Vercel Dashboard (Recommended)

This is the fastest way to rollback a deployment.

#### Steps:

1. **Access Deployments**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to your project
   - Click on "Deployments" tab

2. **Identify Last Working Deployment**
   - Review deployment list (sorted by date, newest first)
   - Find the last deployment that was working correctly
   - Note: Look for deployments marked "Production" before the current one

3. **Promote Previous Deployment**
   - Click the ⋯ (three dots) next to the working deployment
   - Select "Promote to Production"
   - Confirm the action in the dialog

4. **Verify Rollback**
   - Wait 10-30 seconds for DNS propagation
   - Visit your production URL
   - Verify the application is working correctly
   - Check deployment status shows "Ready"

**Time to Complete**: 1-2 minutes

**Pros**: 
- Fastest method
- No code changes required
- Preserves deployment history

**Cons**: 
- Requires Vercel dashboard access
- May have brief downtime during DNS propagation

### Rollback Method 2: Rollback via Vercel CLI

Use this method if you prefer command-line tools or need to automate rollback.

#### Prerequisites:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login
```

#### Steps:

1. **List Recent Deployments**
   ```bash
   # List all deployments for your project
   vercel ls
   
   # Output shows:
   # Age  Deployment                           Status
   # 2m   your-app-abc123.vercel.app          Ready
   # 1h   your-app-xyz789.vercel.app          Ready (Production)
   # 2h   your-app-def456.vercel.app          Ready
   ```

2. **Identify Working Deployment**
   - Find the deployment URL that was working correctly
   - Note the full deployment URL (e.g., `your-app-xyz789.vercel.app`)

3. **Promote to Production**
   ```bash
   # Promote specific deployment to production
   vercel promote your-app-xyz789.vercel.app
   
   # Confirm when prompted
   ```

4. **Verify Rollback**
   ```bash
   # Check current production deployment
   vercel ls --prod
   
   # Visit your production URL to verify
   curl https://your-app.vercel.app
   ```

**Time to Complete**: 2-3 minutes

### Rollback Method 3: Git Revert (For Code-Level Issues)

Use this method when you need to revert code changes and trigger a new deployment.

#### Option A: Revert Last Commit (Safe)

```bash
# Revert the last commit (creates a new commit)
git revert HEAD

# Push to trigger new deployment
git push origin main

# Vercel will automatically deploy the reverted code
```

**Pros**: 
- Preserves git history
- Safe and reversible
- Clear audit trail

**Cons**: 
- Takes longer (full build required)
- Creates additional commits

#### Option B: Reset to Previous Commit (Use with Caution)

```bash
# View commit history
git log --oneline -10

# Reset to specific commit (replace <commit-hash>)
git reset --hard <commit-hash>

# Force push (WARNING: This rewrites history)
git push --force origin main

# Vercel will automatically deploy the reset code
```

**⚠️ WARNING**: Force pushing rewrites git history. Only use if:
- You're the only developer on the branch
- You understand the implications
- You have a backup of the code

**Time to Complete**: 5-10 minutes (includes build time)

### Rollback Method 4: Environment Variable Rollback

If issues are caused by environment variable changes:

1. **Access Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Identify Changed Variables**
   - Review recent changes (Vercel shows edit history)
   - Identify variables that were modified

3. **Revert Variable Values**
   - Click "Edit" on the affected variable
   - Restore the previous value
   - Save changes

4. **Redeploy**
   - Go to Deployments tab
   - Click "Redeploy" on the current deployment
   - Select "Use existing Build Cache" for faster deployment

**Time to Complete**: 2-3 minutes

### Emergency Rollback Procedure

For critical production issues requiring immediate action:

#### Immediate Actions (0-5 minutes):

1. **Alert Team**
   - Notify team members of the issue
   - Assign someone to investigate root cause
   - Assign someone to handle rollback

2. **Quick Rollback**
   - Use Method 1 (Vercel Dashboard) for fastest rollback
   - Promote last known good deployment immediately
   - Don't wait for investigation to complete

3. **Verify Rollback**
   - Confirm application is working
   - Check critical functionality
   - Monitor error rates

#### Follow-Up Actions (5-30 minutes):

4. **Investigate Root Cause**
   - Review deployment logs
   - Check error monitoring tools
   - Identify what caused the failure

5. **Document Incident**
   - Record what went wrong
   - Document rollback actions taken
   - Note time to recovery

6. **Plan Fix**
   - Create fix in separate branch
   - Test thoroughly before redeploying
   - Consider staging environment for testing

### Post-Rollback Checklist

After rolling back, verify:

- [ ] Application is accessible and loading
- [ ] Core functionality works correctly
- [ ] No console errors in browser
- [ ] API connectivity is restored
- [ ] Authentication works
- [ ] Error rates have returned to normal
- [ ] Team is notified of rollback
- [ ] Incident is documented

### Common Rollback Scenarios and Solutions

#### Scenario 1: Build Failure

**Symptoms**: Deployment fails during build process

**Solution**:
- No rollback needed (previous deployment still active)
- Fix build errors in code
- Redeploy when fixed

#### Scenario 2: Runtime Error After Deployment

**Symptoms**: Build succeeds but application crashes at runtime

**Solution**:
1. Immediate rollback using Method 1
2. Check error logs for stack traces
3. Fix code issues
4. Test locally before redeploying

#### Scenario 3: Environment Variable Misconfiguration

**Symptoms**: Application works but can't connect to backend/database

**Solution**:
1. Use Method 4 (Environment Variable Rollback)
2. Verify variable values are correct
3. Redeploy with corrected variables

#### Scenario 4: Performance Degradation

**Symptoms**: Application is slow but functional

**Solution**:
1. Assess severity (if critical, rollback immediately)
2. If minor, monitor and investigate
3. Rollback if performance doesn't improve
4. Optimize code before redeploying

#### Scenario 5: Security Vulnerability Exposed

**Symptoms**: Sensitive data exposed or security breach detected

**Solution**:
1. **IMMEDIATE** rollback using Method 1
2. Revoke compromised credentials immediately
3. Audit logs for unauthorized access
4. Fix security issue before redeploying
5. Consider security audit

### Preventing Future Rollbacks

To minimize the need for rollbacks:

1. **Testing**
   - Run full test suite before deploying
   - Test with production-like environment variables
   - Perform manual testing of critical paths

2. **Staging Environment**
   - Deploy to staging first
   - Test thoroughly in staging
   - Only promote to production after validation

3. **Gradual Rollout**
   - Use Vercel's preview deployments
   - Test with small user group first
   - Monitor metrics before full rollout

4. **Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor performance metrics
   - Set up alerts for critical issues

5. **Deployment Checklist**
   - Follow [Pre-Deployment Checklist](#pre-deployment-checklist)
   - Verify all items before deploying
   - Have rollback plan ready

### Vercel-Specific Rollback Features

Vercel provides additional features to help with rollbacks:

#### Instant Rollback

- Vercel keeps all previous deployments available
- No need to rebuild when rolling back
- Instant promotion to production

#### Deployment Protection

- Enable "Deployment Protection" in project settings
- Requires manual approval before production deployment
- Reduces risk of accidental bad deployments

#### Preview Deployments

- Every branch gets a preview URL
- Test changes before merging to production
- Share preview URLs with team for review

### Troubleshooting Rollback Issues

#### Issue: Rollback Doesn't Fix the Problem

**Possible Causes**:
- Issue is in backend, not frontend
- Database migration can't be reverted
- External service is down
- DNS caching issues

**Solutions**:
- Check backend services
- Verify database state
- Clear DNS cache (wait 5-10 minutes)
- Check external service status

#### Issue: Can't Access Vercel Dashboard

**Solutions**:
- Use Vercel CLI (Method 2)
- Ask team member with access to rollback
- Contact Vercel support for urgent issues

#### Issue: All Recent Deployments Are Broken

**Solutions**:
- Find older working deployment (may be several deployments back)
- Check if issue is environmental (backend down, etc.)
- Consider if database migration caused the issue

### Getting Help

If you're unable to rollback or issues persist:

1. **Vercel Support**
   - Visit [Vercel Support](https://vercel.com/support)
   - For Pro/Enterprise: Use priority support
   - Include deployment URL and error details

2. **Team Resources**
   - Contact DevOps team
   - Escalate to team lead
   - Check internal runbooks

3. **Documentation**
   - [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
   - [Vercel CLI Documentation](https://vercel.com/docs/cli)
   - Project-specific documentation

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)
- [SECURITY.md](./SECURITY.md) - Security guidelines for this project

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Vercel build logs for specific error messages
3. Consult the [Additional Resources](#additional-resources)
4. Contact your team lead or DevOps engineer

---

**Last Updated**: January 2026
