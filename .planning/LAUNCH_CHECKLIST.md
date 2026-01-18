# Launch Checklist

## Pre-Launch

### Environment Configuration
- [ ] All .env variables configured in production
- [ ] `DATABASE_URL` points to production database (Neon PostgreSQL)
- [ ] `AUTH_SECRET` is unique and secure (32+ characters)
- [ ] `AUTH_URL` set to production domain
- [ ] `CORS_ORIGINS` configured for production domains
- [ ] Create.xyz API keys configured
- [ ] Uploadcare public key configured for mobile

### Database
- [ ] Production database provisioned (Neon)
- [ ] Database schema up to date
- [ ] Backup strategy documented
- [ ] Connection limits configured appropriately

### Security Verification
- [ ] Admin backdoor removed (verified in Phase 1)
- [ ] All API routes require authentication (50/56 secured)
- [ ] Rate limiting enabled on login endpoint
- [ ] Security headers configured (X-Frame-Options, etc.)
- [ ] Client isolation working on dashboard
- [ ] Reviewer role enforcement active

### Monitoring Setup
- [ ] Health check endpoint accessible (`/api/health`)
- [ ] Error logging configured
- [ ] Uptime monitoring service set up (e.g., UptimeRobot)
- [ ] Database monitoring enabled (Neon dashboard)

### CI/CD
- [ ] GitHub repository secrets configured (`DATABASE_URL`)
- [ ] CI workflow passing on main branch
- [ ] Deployment pipeline configured

---

## Launch Day

### Pre-Deployment
- [ ] Local build passes (`npm run build`)
- [ ] CI workflow passes
- [ ] All tests passing (if applicable)
- [ ] Team notified of deployment window

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Verify health check returns 200
- [ ] Test critical paths (login, create incident, approve)

### Production Deployment
- [ ] Deploy to production
- [ ] Verify health check returns 200
- [ ] Check security headers in browser devtools
- [ ] Verify rate limiting is active

### Smoke Tests
- [ ] Login works (web + mobile)
- [ ] Dashboard loads with correct data (client isolation)
- [ ] Create incident works
- [ ] Mobile app connects to API
- [ ] Offline sync works (mobile)
- [ ] Approval workflow works (role enforcement)
- [ ] Legal document signatures required

---

## Post-Launch

### First Hour
- [ ] Monitor error rates in logs
- [ ] Check database connection pool
- [ ] Verify all user roles can access appropriate features
- [ ] Check API response times

### First Day
- [ ] Review access logs for anomalies
- [ ] Check for any 500 errors
- [ ] Gather initial user feedback
- [ ] Monitor database performance

### First Week
- [ ] Review security logs
- [ ] Analyze usage patterns
- [ ] Address any reported issues
- [ ] Plan P2/P3 items for future sprints

---

## Rollback Plan

### If Critical Issues Found

1. **Immediate Actions**
   - Notify team of issue
   - Assess severity and impact

2. **Rollback Steps**
   - Revert deployment to previous version
   - Restore database backup if data corruption occurred
   - Verify rollback successful via health check

3. **Communication**
   - Notify users of temporary service disruption
   - Provide estimated time to resolution

4. **Resolution**
   - Fix issues in staging environment
   - Verify fix thoroughly
   - Re-deploy when stable

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| Lead Developer | [Add contact] |
| DevOps | [Add contact] |
| Database Admin | [Add contact] |
| Product Owner | [Add contact] |

---

## Quick Reference

### Health Check
```bash
curl https://your-domain.com/api/health
# Expected: {"status":"ok","database":"connected",...}
```

### Security Headers Check
```bash
curl -I https://your-domain.com
# Look for: X-Frame-Options, X-Content-Type-Options
```

### Rate Limit Test
```bash
# Make 11 rapid requests to login - 11th should return 429
```

---

*Created: 2026-01-17*
*Last Updated: 2026-01-17*
