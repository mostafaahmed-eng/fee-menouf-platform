ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
RUN npm run build

# -----------------------------------------------------------------------------

FROM node:${NODE_VERSION}

LABEL maintainer="FEE-MENOUF DevOps <devops@fee-menouf.edu.eg>"
LABEL description="FEE-MENOUF Smart University Platform - Frontend"

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy production dependencies and build artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set proper permissions
RUN chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["npm", "run", "start"]
