# CI/CD Pipeline Documentation

This document describes the continuous integration and deployment pipeline for rosistat-devops.

## Overview

The project uses GitHub Actions for automated testing and building.

### Workflows

#### Backend CI (`backend-ci.yml`)

Triggered on:
- Push to `main` or `feature/*` branches
- Pull requests to `main`

**Jobs:**

1. **build-and-test** (always runs)
   - Install dependencies: `npm ci`
   - Build TypeScript: `npm run build`
   - Lint check: `npm run lint` (non-blocking)
   - Start backend in background
   - Health check: `GET /api/health` (max 10 retries)
   - Run smoke tests: `npm run test:smoke` (non-blocking)
   - Cleanup process

2. **docker-build** (runs on push to `main` only)
   - Build Docker image with BuildKit
   - Cache layers for faster rebuilds
   - Tag as `rosistat-backend:<commit-sha>`

3. **docker-test** (runs on push to `main`, after docker-build)
   - Build and load Docker image
   - Run container
   - Verify health endpoint
   - Cleanup on completion

## Local Testing

### Run backend tests locally

```bash
cd backend

# Build
npm run build

# Health check (server must be running in another terminal)
# npm run dev:compiled &
# sleep 2
# curl http://localhost:8080/api/health

# Smoke tests
npm run test:smoke
```

### Docker local test

```bash
# Build image
docker build -t rosistat-backend:latest -f backend/Dockerfile backend/

# Run and test
docker run -d --name test -p 8080:8080 rosistat-backend:latest
sleep 2
curl http://localhost:8080/api/health
docker rm -f test
```

## Future Enhancements

### Code Quality

- [ ] Add ESLint for TypeScript linting
- [ ] Add unit tests with Vitest
- [ ] Add code coverage reporting

### Security

- [ ] Add Snyk vulnerability scanning
- [ ] Add SAST (static application security testing) with CodeQL
- [ ] Add dependency version auditing

### Deployment

- [ ] Publish Docker image to registry (Docker Hub, GitHub Container Registry, etc.)
- [ ] Deploy to Kubernetes or Cloud Run
- [ ] Run integration tests against deployed instance
- [ ] Automated rollback on failed health checks

### Monitoring

- [ ] Export build metrics
- [ ] Track deployment frequency & lead time
- [ ] Monitor CI/CD health

## Troubleshooting

### Health check fails in CI

1. Check backend logs in GitHub Actions output
2. Ensure `GET /api/health` endpoint is working locally
3. Verify migrations/seeds are being applied
4. Check database file permissions

### Docker build fails

1. Ensure `backend/Dockerfile` is correct
2. Check Node.js version compatibility
3. Verify `package-lock.json` is up-to-date

### Smoke tests hang

1. Ensure smoke test scripts (`test-*.js`) have timeouts
2. Check if server is still running
3. Add logging to test scripts

## Secrets & Variables

### GitHub Actions Secrets

If deploying to cloud or registry, add secrets in repository settings:
- `DOCKER_USERNAME` / `DOCKER_PASSWORD` (for Docker Hub)
- `REGISTRY_URL` / `REGISTRY_TOKEN` (for custom registry)
- Cloud credentials (AWS, Azure, GCP)

Example usage in workflow:
```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

### Environment Variables

Set via `.env` file locally (never commit):
```bash
PORT=8080
NODE_ENV=development
DB_FILE=/path/to/database.db
```

In CI/CD, inject via `--env-file` or directly.

## Best Practices

1. **Keep workflows fast**: Cache dependencies, parallelize jobs where possible
2. **Fail fast**: Run quick checks (lint, build) before slow ones (tests, Docker)
3. **Clean up**: Always cleanup processes, containers, and temporary files
4. **Log clearly**: Include timestamps and context in logs
5. **Monitor**: Set up alerts for failed jobs
6. **Document**: Update this file when adding new jobs or steps

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
