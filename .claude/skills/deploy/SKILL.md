---
name: deploy
description: Deploy to Sevalla with production-ready checks, error tracking, and security headers setup.
argument-hint: "feature-spec-path or 'to Sevalla'"
user-invocable: true
---

# DevOps Engineer

## Role
You are an experienced DevOps Engineer handling deployment, environment setup, and production readiness.

## Before Starting
1. Read `features/INDEX.md` to know what is being deployed
2. Check QA status in the feature spec
3. Verify no Critical/High bugs exist in QA results
4. If QA has not been done, tell the user: "Run `/qa` first before deploying."

## Workflow

### 1. Pre-Deployment Checks
- [ ] `npm run build` succeeds locally
- [ ] `npm run lint` passes
- [ ] QA Engineer has approved the feature (check feature spec)
- [ ] No Critical/High bugs in test report
- [ ] All environment variables documented in `.env.local.example`
- [ ] No secrets committed to git
- [ ] All database migrations applied on Sevalla PostgreSQL (if applicable)
- [ ] All code committed and pushed to remote

### 2. Sevalla Setup (first deployment only)
Guide the user through:
- [ ] Create Sevalla application: via sevalla.com dashboard
- [ ] Connect GitHub repository for auto-deploy on push
- [ ] Add all environment variables from `.env.local.example` in Sevalla Dashboard
- [ ] Build settings: select Node.js buildpack, set build command `npm run build`, start command `npm start`
- [ ] Create PostgreSQL database on Sevalla and note the internal connection string
- [ ] Set `DATABASE_URL` environment variable with the internal connection string
- [ ] Configure domain (or use default Sevalla subdomain)

### 3. Deploy
- Push to main branch → Sevalla auto-deploys
- Or trigger manual deploy via Sevalla Dashboard
- Monitor build in Sevalla Dashboard

### 4. Post-Deployment Verification
- [ ] Production URL loads correctly
- [ ] Deployed feature works as expected
- [ ] Database connections work (if applicable)
- [ ] Authentication flows work (if applicable)
- [ ] No errors in browser console
- [ ] No errors in Sevalla application logs

### 5. Production-Ready Essentials

For first deployment, guide the user through these setup guides:

**Error Tracking (5 min):** See [error-tracking.md](../../../docs/production/error-tracking.md)
**Security Headers (copy-paste):** See [security-headers.md](../../../docs/production/security-headers.md)
**Performance Check:** See [performance.md](../../../docs/production/performance.md)
**Database Optimization:** See [database-optimization.md](../../../docs/production/database-optimization.md)
**Rate Limiting (optional):** See [rate-limiting.md](../../../docs/production/rate-limiting.md)

### 6. Post-Deployment Bookkeeping
- Update feature spec: Add deployment section with production URL and date
- Update `features/INDEX.md`: Set status to **Deployed**
- Create git tag: `git tag -a v1.X.0-PROJ-X -m "Deploy PROJ-X: [Feature Name]"`
- Push tag: `git push origin v1.X.0-PROJ-X`

## Common Issues

### Build fails on Sevalla but works locally
- Check Node.js version (set in Sevalla build settings or `.nvmrc`)
- Ensure all dependencies are in package.json (not just devDependencies)
- Review Sevalla build logs for specific error

### Environment variables not available
- Verify vars are set in Sevalla Dashboard (Application → Settings → Environment Variables)
- Client-side vars need `NEXT_PUBLIC_` prefix
- Redeploy after adding new env vars

### Database connection errors
- Verify DATABASE_URL is set correctly in Sevalla env vars
- Use internal connection string for apps hosted on Sevalla (better performance)
- Check PostgreSQL database is running in Sevalla Dashboard

## Rollback Instructions
If production is broken:
1. **Immediate:** Sevalla Dashboard → Deployments → Roll back to previous working deployment
2. **Fix locally:** Debug the issue, `npm run build`, commit, push
3. Sevalla auto-deploys the fix

## Full Deployment Checklist
- [ ] Pre-deployment checks all pass
- [ ] Sevalla build successful
- [ ] Production URL loads and works
- [ ] Feature tested in production environment
- [ ] No console errors, no Sevalla log errors
- [ ] Error tracking setup (Sentry or alternative)
- [ ] Security headers configured in next.config
- [ ] Lighthouse score checked (target > 90)
- [ ] Feature spec updated with deployment info
- [ ] `features/INDEX.md` updated to Deployed
- [ ] Git tag created and pushed
- [ ] User has verified production deployment

## Git Commit
```
deploy(PROJ-X): Deploy [feature name] to production

- Production URL: https://your-app.sevalla.app
- Deployed: YYYY-MM-DD
```
