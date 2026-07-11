ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig*.json nest-cli.json ./
COPY src/ src/
RUN npm run build

# -----------------------------------------------------------------------------

FROM node:${NODE_VERSION}

LABEL maintainer="FEE-MENOUF DevOps <devops@fee-menouf.edu.eg>"
LABEL description="FEE-MENOUF Smart University Platform - Backend API"

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy production dependencies and build artifacts
COPY --from=builder /app/package.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set proper permissions
RUN chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=15s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:4000/api/v1/health || exit 1

EXPOSE 4000

CMD ["node", "dist/main"]
