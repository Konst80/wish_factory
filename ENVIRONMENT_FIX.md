# Environment Configuration Fix

## Problem Found

Development deployment (`wish-factory-dev`) was using Production Supabase database instead of Development database.

**Status page showed:**

- Environment: 🌐 Deployed | 🚀 Prod-DB (should be 🔧 Dev-DB)
- URL: `https://bnbzkfwowcqnecrdqdas.s...` (Production)
- Should be: `https://kgowrcgwzqfeiqitavdc.s...` (Development)

## Root Cause

GitHub Actions workflow was not setting environment-specific variables for deployments.

## Solution Applied

Updated `.github/workflows/deploy.yml` to set proper environment variables for each deployment:

### Development Deployment (develop branch)

```yaml
env:
  PUBLIC_SUPABASE_URL: ${{ secrets.DEV_SUPABASE_URL }}
  PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.DEV_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.DEV_SUPABASE_SERVICE_ROLE_KEY }}
  OPENAI_API_KEY: ${{ secrets.DEV_OPENAI_API_KEY }}
```

### Production Deployment (main branch)

```yaml
env:
  PUBLIC_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
  PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.PROD_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.PROD_SUPABASE_SERVICE_ROLE_KEY }}
  OPENAI_API_KEY: ${{ secrets.PROD_OPENAI_API_KEY }}
```

## Required GitHub Secrets

### Development Environment

- `DEV_SUPABASE_URL`: `https://kgowrcgwzqfeiqitavdc.supabase.co`
- `DEV_SUPABASE_ANON_KEY`: Development anon key
- `DEV_SUPABASE_SERVICE_ROLE_KEY`: Development service role key
- `DEV_OPENAI_API_KEY`: Development OpenAI API key

### Production Environment

- `PROD_SUPABASE_URL`: `https://bnbzkfwowcqnecrdqdas.supabase.co`
- `PROD_SUPABASE_ANON_KEY`: Production anon key
- `PROD_SUPABASE_SERVICE_ROLE_KEY`: Production service role key
- `PROD_OPENAI_API_KEY`: Production OpenAI API key

## Verification

After next deployment, the auth/status page should show:

- Development: `🌐 Deployed | 🔧 Dev-DB`
- Production: `🌐 Deployed | 🚀 Prod-DB`

## Next Steps

1. Verify GitHub secrets are configured correctly
2. Push to develop branch to trigger new deployment
3. Check auth/status page shows correct environment
