# FEE-MENOUF Smart University Platform — Production Deployment Guide

## Server Requirements

### Minimum (Development/Staging)
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 22.04 LTS or Debian 12
- **Docker:** 24.0+
- **Docker Compose:** 2.20+

### Recommended (Production)
- **CPU:** 8+ cores (AMD EPYC / Intel Xeon)
- **RAM:** 32 GB
- **Storage:** 200 GB NVMe SSD
- **Network:** 1 Gbps dedicated
- **Backup:** Additional 500 GB for backups
- **OS:** Ubuntu 24.04 LTS

### Additional Requirements
- Domain name with DNS A records configured
- Reverse DNS (PTR) for email deliverability
- Ports 80 (HTTP), 443 (HTTPS) open
- Port 22 (SSH) for administration

## Infrastructure Setup

### 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Verify installation
docker --version && docker compose version
```

### 2. Clone & Configure

```bash
# Clone repository
git clone https://github.com/fee-menouf/fee-menouf-platform.git /opt/fee-menouf
cd /opt/fee-menouf

# Create environment file
cp .env.example .env
# Edit .env with production values (see Environment Variables section)
nano .env
```

## Docker Compose Production Setup

### Production Services

The production deployment includes:

| Service       | Container         | Port  | Scaling                  |
|---------------|-------------------|-------|--------------------------|
| PostgreSQL    | fee-menouf-postgres | 5432 | 1 (master)               |
| Redis         | fee-menouf-redis  | 6379  | 1 (with replica option)  |
| MinIO         | fee-menouf-minio  | 9000  | 1 (with distributed mode)|
| Backend API   | fee-menouf-backend | 4000  | 2-4 replicas             |
| Frontend      | fee-menouf-frontend | 3000 | 2-3 replicas             |
| AI Engine     | fee-menouf-ai-engine | 8000 | 1-2 replicas            |
| Nginx         | fee-menouf-nginx  | 80/443 | 1                       |

### Deploy

```bash
# Pull latest images
docker compose pull

# Start all services
docker compose up -d

# Check health
docker compose ps
scripts/health-check.sh --host https://your-domain.com

# View logs
docker compose logs -f --tail=100
```

### Scaling Services

```bash
# Scale backend to 3 instances
docker compose up -d --scale backend=3

# Update nginx upstream block to include all backend instances
# (Use Docker's internal DNS for service discovery)
```

## Nginx Configuration

See `docker/nginx/nginx.conf` for the complete production configuration. Key settings:

- **SSL/TLS** with modern ciphers (TLSv1.2, TLSv1.3)
- **Rate limiting** per endpoint group
- **Security headers** (HSTS, CSP, X-Frame-Options, etc.)
- **Gzip compression** for static assets
- **WebSocket support** for real-time notifications
- **Reverse proxy** to backend, frontend, and AI engine
- **Static asset caching** with long expiry (365d for _next/static)

## SSL/HTTPS Setup (Let's Encrypt)

### Automated with Certbot (Docker)

```bash
# Run certbot to obtain certificates
docker compose exec nginx certbot certonly --webroot \
  -w /usr/share/nginx/html \
  -d your-domain.com \
  -d api.your-domain.com \
  -d admin.your-domain.com

# Certificates are stored in docker/nginx/ssl/
# Set up auto-renewal
crontab -e
# Add: 0 3 * * * docker compose exec nginx certbot renew --quiet
```

### Manual Setup

```bash
# Install certbot
sudo apt install -y certbot

# Obtain certificates
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d api.your-domain.com

# Copy to nginx ssl directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/
```

## Environment Variables (Production)

Must be configured in `.env` before deployment:

```env
NODE_ENV=production
APP_NAME=FEE-MENOUF-Smart-University

# Database
DB_PASS=<strong_random_password_32_chars>

# JWT
JWT_ACCESS_SECRET=<openssl_rand_hex_64>
JWT_REFRESH_SECRET=<openssl_rand_hex_64>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Encryption
ENCRYPTION_KEY=<openssl_rand_hex_32>

# OpenAI (for AI features)
OPENAI_API_KEY=<sk-actual-api-key>

# SMTP (for email notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid_api_key>
SMTP_FROM_EMAIL=noreply@fee-menouf.edu.eg

# MinIO
MINIO_ROOT_PASSWORD=<strong_password>

# CORS
CORS_ORIGINS=https://your-domain.com,https://admin.your-domain.com

# Rate Limiting (production hardening)
RATE_LIMIT_MAX_REQUESTS=60
RATE_LIMIT_MAX_LOGIN_ATTEMPTS=3
```

## Monitoring Setup

### Prometheus + Grafana

```yaml
# Add to docker-compose.yml (monitoring stack)
services:
  prometheus:
    image: prom/prometheus:v2.54.0
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:11.0.0
    volumes:
      - ./docker/grafana/datasources:/etc/grafana/provisioning/datasources
      - ./docker/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: <grafana_admin_password>
      GF_INSTALL_PLUGINS: grafana-piechart-panel

  node-exporter:
    image: prom/node-exporter:v1.8.0
    network_mode: host

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    environment:
      DATA_SOURCE_NAME: "postgresql://fee_menouf_user:<password>@postgres:5432/fee_menouf?sslmode=disable"

  redis-exporter:
    image: oliver006/redis_exporter:v1.63.0
    environment:
      REDIS_ADDR: redis://redis:6379
```

### Key Metrics to Monitor
- Backend: Request rate, p95 latency, error rate, memory usage
- AI Engine: Inference time, RAG retrieval time, queue depth
- PostgreSQL: Connection count, query duration, cache hit ratio
- Redis: Memory usage, hit rate, connected clients
- System: CPU, memory, disk I/O, network

## Backup Strategy

### Automated Daily Backups

```bash
# Create backup script at /opt/fee-menouf/scripts/backup.sh
#!/bin/bash
BACKUP_DIR="/opt/fee-menouf/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Database backup
docker compose exec -T postgres pg_dump \
  -U fee_menouf_user fee_menouf \
  | gzip > "$BACKUP_DIR/db-$TIMESTAMP.sql.gz"

# Upload to S3-compatible storage (MinIO/Wasabi)
aws s3 cp "$BACKUP_DIR/db-$TIMESTAMP.sql.gz" s3://fee-menouf-backups/

# Retention: keep 7 daily, 4 weekly, 6 monthly
find "$BACKUP_DIR" -name "db-*.sql.gz" -mtime +7 -delete
```

### Cron Schedule
```bash
# Add to crontab
0 2 * * * /opt/fee-menouf/scripts/backup.sh
0 3 * * 7 /opt/fee-menouf/scripts/backup.sh --full
```

### Backup Verification
```bash
# Test restoring backup monthly
gunzip -c backups/db-20260101-020000.sql.gz | docker compose exec -T postgres \
  psql -U fee_menouf_user -d fee_menouf_restore_test
```

## Scaling Considerations

### Horizontal Scaling

- **Backend:** Stateless NestJS app — scale horizontally behind Nginx
- **Frontend:** Stateless Next.js — scale horizontally
- **AI Engine:** CPU/memory intensive — needs dedicated instances
- **PostgreSQL:** Consider read replicas for reporting queries
- **Redis:** Cluster mode for cache-heavy workloads

### Vertical Scaling

- **AI Engine:** Most resource-intensive. Recommend 4+ CPUs, 4+ GB RAM
- **PostgreSQL:** Increase shared_buffers to 25% of available RAM
- **Backend:** Node.js clustering (use PM2 or cluster mode)
- **File Storage:** Increase MinIO disk space or configure distributed mode

### Performance Tuning

```ini
# PostgreSQL tuning (postgresql.conf)
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 1GB
random_page_cost = 1.1
effective_io_concurrency = 200
max_connections = 50
```

## Troubleshooting Guide

### Service Won't Start

```bash
# Check logs
docker compose logs backend --tail=100
docker compose logs ai-engine --tail=100

# Check environment
docker compose exec backend env | grep -v SECRET

# Verify configuration
docker compose config
```

### Database Connection Issues

```bash
# Test connectivity
docker compose exec -it postgres psql -U fee_menouf_user -d fee_menouf -c "SELECT 1"

# Check pg_hba.conf
docker compose exec postgres cat /var/lib/postgresql/data/pg_hba.conf

# Verify env variables match
grep DB_ .env
```

### High Memory Usage

```bash
# Check per-container usage
docker stats

# Restart specific service
docker compose restart ai-engine

# Increase limits in docker-compose.yml
# Add deploy.resources.limits section
```

### SSL Certificate Issues

```bash
# Check certificate expiry
docker compose exec nginx openssl x509 -in /etc/nginx/ssl/fullchain.pem -noout -dates

# Force renewal
docker compose exec nginx certbot renew --force-renewal

# Reload nginx
docker compose exec nginx nginx -s reload
```

### Performance Issues

```bash
# Check database slow queries
docker compose exec postgres psql -U fee_menouf_user -d fee_menouf -c \
  "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 20;"

# Check backend response times via Prometheus
# Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Check AI engine queue
docker compose exec redis redis-cli LLEN bull:ai-engine:wait
```

### Rollback Procedure

```bash
# If deployment fails:
# 1. Revert to previous working version
git revert HEAD --no-commit
git commit -m "revert: rollback to previous stable version"

# 2. Redeploy with previous images
docker compose pull
docker compose up -d

# 3. If database migration was applied, revert it
docker compose exec backend node dist/commands/revert-migration.js
```

### Emergency Restart

```bash
# Full restart of all services
docker compose down
docker compose up -d

# Force rebuild
docker compose build --no-cache
docker compose up -d
```

## Security Checklist

- [ ] All default passwords changed (DB, MinIO, JWT, Grafana)
- [ ] SSL certificates valid and auto-renewal configured
- [ ] Firewall configured (UFW): allow only 22, 80, 443
- [ ] Fail2ban installed for SSH brute force protection
- [ ] Docker daemon configured with security best practices
- [ ] PostgreSQL configured with SSL and password auth
- [ ] Backups encrypted before transfer to remote storage
- [ ] Monitoring and alerting configured (CPU, memory, disk, SSL expiry)
- [ ] Rate limiting verified with load testing
- [ ] Audit logging enabled and log rotation configured
- [ ] Regular security scans scheduled (npm audit, pip audit)
