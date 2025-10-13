# Backend-only Dockerfile for AWS Elastic Beanstalk (Single Docker)
# Builds and runs rosistat-backend and bundles the database/migrations

FROM node:20-alpine AS deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
ENV DB_FILE=/app/database/rosistat.db
# Install runtime deps and app dist
COPY --from=deps /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY backend/package.json ./
# Bundle database (migrations + seeds + initial file) relative to backend/dist
COPY database /app/database

# EB single-container Docker expects the app to listen on 8080
EXPOSE 8080
CMD ["node", "dist/index.js"]