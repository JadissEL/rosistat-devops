# Security Guidelines

This document outlines security best practices for the rosistat-devops project.

## Environment Variables & Secrets

### Development

- Create a local `.env` file in `backend/` from `backend/.env.example`
- **Never commit `.env` or any file containing secrets** to Git
- Use `.gitignore` to prevent accidental commits (already configured)

Example setup:
```bash
cd backend
cp .env.example .env
# Edit .env with your local values
echo ".env" >> .gitignore  # Already in root .gitignore
```

### Production

- Use your deployment platform's secret management:
  - **Docker**: Pass secrets via `--env-file`, Docker secrets, or orchestrator
  - **Kubernetes**: Use Secrets and mount as environment variables or files
  - **GitHub Actions**: Use GitHub Secrets for CI/CD workflows
  - **Cloud Providers** (AWS, Azure, GCP): Use native secret managers (Secrets Manager, Key Vault, Secret Manager)

Example with Docker:
```bash
docker run -d \
  --env-file /secure/path/.env.prod \
  -e DATABASE_PASSWORD="$(aws secretsmanager get-secret-value --secret-id db-password --query SecretString --output text)" \
  rosistat-backend:latest
```

## Code Scanning

### Current Status

- No static code analysis (ESLint, Snyk, etc.) configured yet
- **Recommended**: Add ESLint for TypeScript best practices and security issues

### Future Improvements

```bash
# Install ESLint (development)
npm install --save-dev eslint eslint-plugin-security eslint-plugin-node

# Create ESLint config for TypeScript
npx eslint --init
```

## Dependencies

### Audit

```bash
# Check for known vulnerabilities
npm audit

# Fix automatically (use with caution)
npm audit fix

# In CI/CD
npm ci
npm audit --audit-level=moderate
```

### Regular Updates

- Keep dependencies updated: `npm update` or `npm outdated`
- Subscribe to security advisories from npm

## API Security

### Current Implementation

- Health endpoint: `GET /api/health` (public, no auth required)
- Mock editor endpoint: `POST /api/editor` (no authentication yet)

### Future Recommendations

- Add authentication (JWT, OAuth2) if handling user data
- Implement rate limiting to prevent DoS attacks
- Use HTTPS in production (handled by load balancer/reverse proxy)
- Validate and sanitize all user inputs
- Add CORS policy (configured in `src/index.ts`)

## Database Security

### SQLite Considerations

SQLite is file-based and suitable for:
- Development & testing
- Small-scale production with single-process access
- Embedded systems

**For production multi-process/distributed systems**, consider migrating to:
- PostgreSQL
- MySQL
- MongoDB

### Current Setup

- Database file location: `DB_FILE` environment variable (default: repo-relative)
- **Production**: Store database file in a protected volume with restricted permissions

```bash
# Secure file permissions (Linux/macOS)
chmod 700 /var/lib/rosistat
chmod 600 /var/lib/rosistat/rosistat.db
chown app:app /var/lib/rosistat/rosistat.db
```

## Deployment Security

### Docker

- Base image: `node:20-alpine` (minimal, regularly updated)
- Multi-stage build: avoids including dev dependencies in production
- No secrets baked into image

### Kubernetes (if applicable)

- Use Network Policies to restrict pod communication
- Use Pod Security Policies to enforce security standards
- Use RBAC for access control

### GitHub Actions

- Store secrets in GitHub Settings > Secrets
- Review workflow permissions
- Use pinned action versions to prevent tampering

## Monitoring & Logging

### Current Status

- Logs printed to stdout/stderr
- Health endpoint for readiness/liveness checks

### Recommendations

- Aggregate logs to centralized system (ELK, Splunk, Datadog, CloudWatch)
- Monitor for unusual patterns (e.g., repeated failed auth attempts)
- Set up alerts for critical errors or security events
- Use structured logging (JSON format) for easy parsing

## Compliance & Audit

- **GDPR**: Ensure user data handling is compliant (see `src/pages/PrivacyPolicy.tsx`)
- **Backup**: Regular database backups (see `PRODUCTION.md`)
- **Access Control**: Limit who can deploy and access production

## Incident Response

If a security issue is discovered:

1. **Do not commit secrets or compromised credentials**
2. **Rotate credentials immediately** if exposed
3. **Notify relevant parties** (team, users if data exposed)
4. **Patch and redeploy** as soon as possible
5. **Document the incident** for future reference

## Reporting Security Issues

If you discover a security vulnerability:

- **Do not open a public issue** on GitHub
- Email security concerns to the project maintainer
- Include: description, impact, and suggested fix
- Allow time for a fix before public disclosure (responsible disclosure)

## Security Checklist

- [ ] No secrets in `.env` files committed to Git
- [ ] `.gitignore` includes `.env` and other sensitive files
- [ ] Production uses secret management tools
- [ ] Database file has restricted permissions
- [ ] Health endpoint monitored for failures
- [ ] Logs aggregated and monitored
- [ ] Dependencies regularly audited
- [ ] TLS/HTTPS enforced in production (via reverse proxy)
- [ ] Input validation and sanitization in place
- [ ] Rate limiting enabled (if applicable)
