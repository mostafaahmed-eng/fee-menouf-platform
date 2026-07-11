# FEE-MENOUF Smart University Platform — Setup Guide

## Prerequisites

| Tool           | Minimum Version | Required For          |
|----------------|-----------------|-----------------------|
| Node.js        | 20.0+           | Backend + Frontend    |
| npm            | 9.0+            | Package management    |
| Docker         | 24.0+           | Containerized running |
| Docker Compose | 2.20+           | Orchestration         |
| Python         | 3.12+           | AI Engine             |
| Git            | 2.40+           | Version control       |
| OpenSSL        | 3.0+            | Key generation        |

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/fee-menouf/fee-menouf-platform.git
cd fee-menouf-platform
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Then edit `.env` with your values. Key variables to customize:

```env
# Database
DB_PASS=your_strong_db_password_here

# JWT (generate with: openssl rand -hex 64)
JWT_ACCESS_SECRET=<generated_64_hex_chars>
JWT_REFRESH_SECRET=<generated_64_hex_chars>

# Encryption
ENCRYPTION_KEY=<generated_32_hex_chars>

# OpenAI (required for AI features)
OPENAI_API_KEY=sk-your-actual-key

# MinIO
MINIO_ROOT_PASSWORD=your_minio_strong_password
```

### 3. Auto-generate Secrets

```bash
# Run the setup script (generates secrets, installs deps, starts Docker)
bash scripts/setup.sh
```

Or manually generate secrets:

```bash
openssl rand -hex 64  # For JWT secrets
openssl rand -hex 32  # For encryption key
openssl rand -hex 16  # For CSRF secret
```

## Installation (Step-by-Step)

### Option A: Running with Docker (Recommended)

```bash
# 1. Install dependencies
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..

# 2. Build and start all services
docker compose up -d --build

# 3. Verify services are healthy
docker compose ps
# All services should show "healthy" status

# 4. Seed the database
bash scripts/seed.sh

# 5. Access the platform
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api/v1
# AI Engine: http://localhost:8000
# Swagger Docs: http://localhost:4000/api/docs
# MinIO Console: http://localhost:9001
```

### Option B: Running without Docker (Development)

#### Start PostgreSQL, Redis, MinIO manually (or use Docker for infrastructure only):

```bash
# Start only infrastructure services
docker compose up -d postgres redis minio
```

#### Backend Setup:

```bash
cd backend
npm ci
npm run start:dev
# Server starts on http://localhost:4000
```

#### Frontend Setup:

```bash
cd frontend
npm ci
npm run dev
# Server starts on http://localhost:3000
```

#### AI Engine Setup:

```bash
cd ai-engine
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Server starts on http://localhost:8000
```

## Seeding the Database

```bash
# Standard seed (via Docker container)
bash scripts/seed.sh

# Preview without making changes
bash scripts/seed.sh --dry-run

# Force re-seed
bash scripts/seed.sh --force

# Seed via direct psql connection
bash scripts/seed.sh --direct
```

## First Login Credentials

| Role          | Email                          | Password  |
|---------------|--------------------------------|-----------|
| Super Admin   | admin@fee-menouf.edu.eg        | admin123  |

**IMPORTANT:** Change the default admin password immediately after first login.

## Post-Setup Verification

After setup, verify all services are operational:

```bash
# Run health check script
bash scripts/health-check.sh --host http://localhost
# Expected: All services report healthy

# Or check individually:
curl http://localhost:4000/api/v1/health
curl http://localhost:3000
curl http://localhost:8000/health
```

## Troubleshooting

### Docker Issues

```bash
# View service logs
docker compose logs -f backend
docker compose logs -f ai-engine

# Reset everything
docker compose down -v
docker compose up -d --build

# Check resource usage
docker stats
```

### Database Issues

```bash
# Connect to database directly
docker compose exec -it postgres psql -U fee_menouf_user -d fee_menouf

# Reset database
docker compose down -v
docker compose up -d postgres
bash scripts/seed.sh
```

### Backend Issues

```bash
# Check TypeScript compilation
cd backend && npm run build

# Run tests
cd backend && npm test

# Check for circular dependencies
npx madge --circular src/main.ts
```

### Frontend Issues

```bash
# Clear Next.js cache
cd frontend && rm -rf .next

# Rebuild
cd frontend && npm run build
```

### AI Engine Issues

```bash
# Verify Python dependencies
cd ai-engine && pip check

# Test AI engine directly
curl http://localhost:8000/health
```

## Common Environment Variables Reference

| Variable                    | Default             | Description                         |
|-----------------------------|---------------------|-------------------------------------|
| NODE_ENV                    | production          | Environment mode                    |
| DB_HOST                     | localhost           | PostgreSQL host                     |
| DB_PORT                     | 5432                | PostgreSQL port                     |
| DB_NAME                     | fee_menouf          | Database name                       |
| DB_USER                     | fee_menouf_user     | Database user                       |
| DB_PASS                     | (required)          | Database password                   |
| REDIS_HOST                  | localhost           | Redis host                          |
| REDIS_PORT                  | 6379                | Redis port                          |
| JWT_ACCESS_SECRET           | (required)          | JWT signing secret                  |
| JWT_REFRESH_SECRET          | (required)          | JWT refresh secret                  |
| OPENAI_API_KEY              | (required for AI)   | OpenAI API key                      |
| SMTP_HOST                   | smtp.sendgrid.net   | Email server host                   |
| SMTP_USER                   | apikey              | Email username                      |
| SMTP_PASS                   | (required)          | Email password/api key              |
| MINIO_ROOT_USER             | minioadmin          | MinIO admin username                |
| MINIO_ROOT_PASSWORD         | (required)          | MinIO admin password                |
| CORS_ORIGINS                | http://localhost:5173 | Allowed CORS origins              |
