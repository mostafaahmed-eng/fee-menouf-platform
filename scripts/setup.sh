#!/usr/bin/env bash
# =============================================================================
# FEE-MENOUF Smart University Platform - Setup Script
# =============================================================================
# Usage:
#   chmod +x scripts/setup.sh && ./scripts/setup.sh
# =============================================================================

set -o errexit
set -o pipefail
set -o nounset

# Colors for output
declare -r GREEN='\033[0;32m'
declare -r YELLOW='\033[1;33m'
declare -r RED='\033[0;31m'
declare -r CYAN='\033[0;36m'
declare -r NC='\033[0m' # No Color

declare -r PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
declare -r LOG_FILE="/tmp/fee-menouf-setup-$(date +%Y%m%d-%H%M%S).log"

# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*" | tee -a "${LOG_FILE}"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" | tee -a "${LOG_FILE}"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" | tee -a "${LOG_FILE}"; }
log_step()  { echo -e "\n${CYAN}══════════════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"; }

check_command() {
    if ! command -v "$1" &>/dev/null; then
        log_error "Required command '$1' is not installed."
        return 1
    fi
    log_info "Found $1: $($1 --version 2>&1 | head -1)"
}

check_version() {
    local cmd=$1
    local required_min=$2
    local version_string=$($cmd --version 2>&1 | grep -oP '\d+\.\d+' | head -1)

    if [[ -z "$version_string" ]]; then
        log_warn "Could not determine version for $cmd"
        return 0
    fi

    local major=$(echo "$version_string" | cut -d. -f1)
    local minor=$(echo "$version_string" | cut -d. -f2)
    local required_major=$(echo "$required_min" | cut -d. -f1)
    local required_minor=$(echo "$required_min" | cut -d. -f2)

    if (( major < required_major || (major == required_major && minor < required_minor) )); then
        log_error "$cmd version $version_string < required minimum $required_min"
        return 1
    fi
    log_info "$cmd version $version_string meets minimum $required_min"
}

# ---------------------------------------------------------------------------
# Pre-checks
# ---------------------------------------------------------------------------

log_step "Checking prerequisites"

PREREQ_FAILED=false

# Docker
check_command docker || PREREQ_FAILED=true
if command -v docker &>/dev/null; then
    check_version docker "20.0" || PREREQ_FAILED=true
fi

# Docker Compose (check both docker compose and docker compose)
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
    log_info "Found docker compose (integrated)"
elif command -v docker compose &>/dev/null; then
    log_info "Found docker compose (standalone)"
else
    log_error "Required command 'docker compose' is not installed."
    PREREQ_FAILED=true
fi

# Node.js (for backend/frontend)
check_command node || PREREQ_FAILED=true
if command -v node &>/dev/null; then
    check_version node "18.0" || PREREQ_FAILED=true
fi

# npm
check_command npm || PREREQ_FAILED=true
if command -v npm &>/dev/null; then
    check_version npm "9.0" || PREREQ_FAILED=true
fi

# Python (for AI engine)
check_command python3 || check_command python || PREREQ_FAILED=true

# pg_isready (optional, for DB check)
command -v pg_isready &>/dev/null && log_info "Found pg_isready" || log_warn "pg_isready not found (optional - only needed for direct DB checks)"

# OpenSSL (for key generation)
check_command openssl || PREREQ_FAILED=true

# Git
check_command git || PREREQ_FAILED=true

if [[ "$PREREQ_FAILED" = true ]]; then
    log_error "Some prerequisites are missing. Please install them and re-run."
    exit 1
fi

log_info "All prerequisites satisfied."

# ---------------------------------------------------------------------------
# Environment file
# ---------------------------------------------------------------------------

log_step "Environment configuration"

if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
    if [[ -f "${PROJECT_ROOT}/.env.example" ]]; then
        cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
        log_info "Created .env from .env.example"

        # Auto-generate secrets
        log_info "Generating secure random secrets..."

        # Detect sed -i syntax (GNU vs BSD)
        if sed --version 2>/dev/null | grep -q GNU; then
            SED_INLINE=(sed -i)
        else
            SED_INLINE=(sed -i '')
        fi

        "${SED_INLINE[@]}" "s/your_jwt_access_secret_min_32_chars/$(openssl rand -hex 64)/" "${PROJECT_ROOT}/.env"
        "${SED_INLINE[@]}" "s/your_jwt_refresh_secret_min_32_chars/$(openssl rand -hex 64)/" "${PROJECT_ROOT}/.env"
        "${SED_INLINE[@]}" "s/your_64_character_hex_encryption_key_here/$(openssl rand -hex 32)/" "${PROJECT_ROOT}/.env"
        "${SED_INLINE[@]}" "s/your_session_secret_at_least_32_chars/$(openssl rand -hex 32)/" "${PROJECT_ROOT}/.env"
        "${SED_INLINE[@]}" "s/your_csrf_secret_hex/$(openssl rand -hex 16)/" "${PROJECT_ROOT}/.env"
        "${SED_INLINE[@]}" "s/sk-your-openai-api-key/${OPENAI_API_KEY:-sk-your-openai-api-key}/" "${PROJECT_ROOT}/.env"

        log_info "Secrets generated in .env"
        log_warn "IMPORTANT: Review and update .env with your actual values before starting!"
    else
        log_error ".env.example not found. Cannot create .env"
        exit 1
    fi
else
    log_info ".env already exists, skipping."
fi

# ---------------------------------------------------------------------------
# Install dependencies
# ---------------------------------------------------------------------------

log_step "Installing dependencies"

# Backend dependencies
if [[ -d "${PROJECT_ROOT}/backend" ]] && [[ -f "${PROJECT_ROOT}/backend/package.json" ]]; then
    log_info "Installing backend dependencies..."
    cd "${PROJECT_ROOT}/backend"
    npm ci --only=production 2>&1 | tee -a "${LOG_FILE}"
    log_info "Backend dependencies installed."
fi

# Frontend dependencies
if [[ -d "${PROJECT_ROOT}/frontend" ]] && [[ -f "${PROJECT_ROOT}/frontend/package.json" ]]; then
    log_info "Installing frontend dependencies..."
    cd "${PROJECT_ROOT}/frontend"
    npm ci 2>&1 | tee -a "${LOG_FILE}"
    log_info "Frontend dependencies installed."
fi

# AI Engine dependencies
if [[ -d "${PROJECT_ROOT}/ai-engine" ]] && [[ -f "${PROJECT_ROOT}/ai-engine/requirements.txt" ]]; then
    log_info "Installing AI Engine Python dependencies..."
    cd "${PROJECT_ROOT}/ai-engine"
    if command -v python3 &>/dev/null; then
        python3 -m venv .venv 2>&1 | tee -a "${LOG_FILE}"
        source .venv/bin/activate
        pip install --upgrade pip 2>&1 | tee -a "${LOG_FILE}"
        pip install -r requirements.txt 2>&1 | tee -a "${LOG_FILE}"
        deactivate
    elif command -v python &>/dev/null; then
        python -m venv .venv 2>&1 | tee -a "${LOG_FILE}"
        source .venv/bin/activate
        pip install --upgrade pip 2>&1 | tee -a "${LOG_FILE}"
        pip install -r requirements.txt 2>&1 | tee -a "${LOG_FILE}"
        deactivate
    fi
    log_info "AI Engine dependencies installed."
fi

# ---------------------------------------------------------------------------
# Docker services
# ---------------------------------------------------------------------------

log_step "Starting Docker Compose services"

cd "${PROJECT_ROOT}"

# Pull latest images
log_info "Pulling Docker images..."
docker compose pull 2>&1 | tee -a "${LOG_FILE}"

# Build and start services
log_info "Building and starting services..."
docker compose up --build -d 2>&1 | tee -a "${LOG_FILE}"

# Wait for health checks
log_info "Waiting for services to become healthy..."
sleep 10

SERVICES=("postgres" "redis" "minio" "backend" "frontend" "ai-engine" "nginx")
for service in "${SERVICES[@]}"; do
    if docker compose ps --filter "status=running" --services | grep -q "^${service}$"; then
        log_info "✓ ${service} is running."
    else
        log_warn "✗ ${service} is NOT running. Check logs: docker compose logs ${service}"
    fi
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

log_step "Setup Complete"

echo ""
echo -e "  ${GREEN}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
echo -e "  ${GREEN}▓${NC}                                                                 ${GREEN}▓${NC}"
echo -e "  ${GREEN}▓${NC}  ${CYAN}FEE-MENOUF Smart University Platform${NC}                    ${GREEN}▓${NC}"
echo -e "  ${GREEN}▓${NC}                                                                 ${GREEN}▓${NC}"
echo -e "  ${GREEN}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
echo ""
echo -e "  ${YELLOW}Frontend:${NC}  http://localhost:3000"
echo -e "  ${YELLOW}Backend:${NC}   http://localhost:4000/api/health"
echo -e "  ${YELLOW}AI Engine:${NC} http://localhost:8000/health"
echo -e "  ${YELLOW}MinIO:${NC}     http://localhost:9001"
echo -e "  ${YELLOW}Nginx:${NC}     http://localhost"
echo ""
echo -e "  ${YELLOW}Logs:${NC}      ${LOG_FILE}"
echo -e "  ${YELLOW}To stop:${NC}   docker compose down"
echo -e "  ${YELLOW}To reset:${NC}  docker compose down -v"
echo ""
echo -e "  ${GREEN}Setup completed successfully.${NC}"
echo ""
