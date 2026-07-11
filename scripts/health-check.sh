#!/usr/bin/env bash
# =============================================================================
# FEE-MENOUF Smart University Platform - Comprehensive Health Check
# =============================================================================
# Checks all services, database, Redis, and reports status.
# Exits with code 0 if all services are healthy, 1 otherwise.
#
# Usage:
#   ./scripts/health-check.sh
#   ./scripts/health-check.sh --host https://fee-menouf.local
#   ./scripts/health-check.sh --verbose
#   ./scripts/health-check.sh --timeout 10
# =============================================================================

set -o errexit
set -o pipefail

# Defaults
BASE_URL="${HEALTH_CHECK_URL:-http://localhost}"
TIMEOUT=5
VERBOSE=false
EXIT_ON_FAILURE=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) BASE_URL="$2"; shift 2 ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    --verbose) VERBOSE=true; shift ;;
    --no-exit) EXIT_ON_FAILURE=false; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

SERVICES=(
  "Backend API:${BASE_URL}/api/v1/health:200"
  "Frontend:${BASE_URL}/:200"
  "AI Engine:${BASE_URL}/health:200"
  "MinIO:${BASE_URL}/minio/health/live:200"
  "Nginx:${BASE_URL}/:200"
)

# Stats
TOTAL=0
PASSED=0
FAILED=0
START_TIME=$(date +%s%N)

print_banner() {
  echo ""
  echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  FEE-MENOUF Smart University Platform - Health Check${NC}"
  echo -e "${CYAN}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${CYAN}  Target: ${BASE_URL}${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_result() {
  local service="$1"
  local endpoint="$2"
  local status="$3"
  local code="$4"
  local time="$5"

  if [[ "$status" == "PASS" ]]; then
    echo -e "  ${GREEN}✓${NC} ${BOLD}${service}${NC} (${endpoint})"
    echo -e "     Status: ${GREEN}${code}${NC} | Time: ${time}s"
  elif [[ "$status" == "FAIL" ]]; then
    echo -e "  ${RED}✗${NC} ${BOLD}${service}${NC} (${endpoint})"
    echo -e "     Status: ${RED}${code}${NC}"
  fi
  echo ""
}

check_http() {
  local name="$1"
  local url="$2"
  local expected_code="$3"

  ((TOTAL++))
  echo -e "  ${YELLOW}→${NC} Checking ${BOLD}${name}${NC}..."

  local start=$(date +%s%N)
  local http_code
  local response_time

  http_code=$(curl -sSf -o /dev/null -w "%{http_code}" \
    --max-time "$TIMEOUT" \
    --connect-timeout "$((TIMEOUT / 2))" \
    "$url" 2>/dev/null || echo "000")

  local end=$(date +%s%N)
  response_time=$(echo "scale=2; ($end - $start) / 1000000000" | bc 2>/dev/null || echo "0.00")

  if [[ "$http_code" == "$expected_code" ]]; then
    ((PASSED++))
    print_result "$name" "$url" "PASS" "$http_code" "$response_time"
    return 0
  else
    ((FAILED++))
    print_result "$name" "$url" "FAIL" "HTTP ${http_code} (expected ${expected_code})" "$response_time"
    return 1
  fi
}

check_database() {
  local name="PostgreSQL Database"
  ((TOTAL++))
  echo -e "  ${YELLOW}→${NC} Checking ${BOLD}${name}${NC}..."

  local start=$(date +%s%N)
  local result

  result=$(docker compose exec -T postgres \
    pg_isready -U "${DB_USER:-fee_menouf_user}" -d "${DB_NAME:-fee_menouf}" 2>/dev/null) || true

  local end=$(date +%s%N)
  local response_time
  response_time=$(echo "scale=2; ($end - $start) / 1000000000" | bc 2>/dev/null || echo "0.00")

  if echo "$result" | grep -q "accepting connections"; then
    ((PASSED++))
    echo -e "  ${GREEN}✓${NC} ${BOLD}${name}${NC}"
    echo -e "     Status: ${GREEN}accepting connections${NC} | Time: ${response_time}s"
    echo ""
    return 0
  else
    ((FAILED++))
    echo -e "  ${RED}✗${NC} ${BOLD}${name}${NC}"
    echo -e "     Status: ${RED}not responding${NC}"
    echo ""
    return 1
  fi
}

check_redis() {
  local name="Redis Cache"
  ((TOTAL++))
  echo -e "  ${YELLOW}→${NC} Checking ${BOLD}${name}${NC}..."

  local start=$(date +%s%N)
  local result

  result=$(docker compose exec -T redis \
    redis-cli ping 2>/dev/null) || true

  local end=$(date +%s%N)
  local response_time
  response_time=$(echo "scale=2; ($end - $start) / 1000000000" | bc 2>/dev/null || echo "0.00")

  if echo "$result" | grep -q "PONG"; then
    ((PASSED++))
    echo -e "  ${GREEN}✓${NC} ${BOLD}${name}${NC}"
    echo -e "     Status: ${GREEN}PONG${NC} | Time: ${response_time}s"
    echo ""
    return 0
  else
    ((FAILED++))
    echo -e "  ${RED}✗${NC} ${BOLD}${name}${NC}"
    echo -e "     Status: ${RED}not responding${NC}"
    echo ""
    return 1
  fi
}

print_summary() {
  local end_time=$(date +%s%N)
  local total_time
  total_time=$(echo "scale=2; ($end_time - $START_TIME) / 1000000000" | bc 2>/dev/null || echo "0.00")

  echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
  echo -e " ${BOLD}Health Check Summary${NC}"
  echo ""
  echo -e "  Total:   ${TOTAL}"
  echo -e "  Passed:  ${GREEN}${PASSED}${NC}"
  echo -e "  Failed:  ${RED}${FAILED}${NC}"
  echo -e "  Time:    ${total_time}s"
  echo ""

  if [[ "$FAILED" -eq 0 ]]; then
    echo -e " ${GREEN} All services are healthy.${NC}"
    echo ""
    return 0
  else
    echo -e " ${RED} ${FAILED} service(s) are unhealthy.${NC}"
    echo ""
    return 1
  fi
}

# ---- Main ----
print_banner

# Check HTTP services
for service_entry in "${SERVICES[@]}"; do
  IFS=':' read -r name url expected <<< "$service_entry"
  check_http "$name" "$url" "$expected" || true
done

# Check database (if docker compose is available)
if command -v docker &>/dev/null && docker compose ps 2>/dev/null | grep -q "postgres"; then
  check_database || true
else
  echo -e "  ${YELLOW}⚠${NC} PostgreSQL check skipped (not running via Docker Compose)"
  echo ""
fi

# Check Redis (if docker compose is available)
if command -v docker &>/dev/null && docker compose ps 2>/dev/null | grep -q "redis"; then
  check_redis || true
else
  echo -e "  ${YELLOW}⚠${NC} Redis check skipped (not running via Docker Compose)"
  echo ""
fi

print_summary
exit_code=$?

if [[ "$EXIT_ON_FAILURE" == "true" ]]; then
  exit $exit_code
fi
