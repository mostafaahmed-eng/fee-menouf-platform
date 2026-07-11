#!/usr/bin/env bash
# =============================================================================
# FEE-MENOUF Smart University Platform - Database Seeding Script
# =============================================================================
# Seeds the database with initial data: departments, programs, users,
# courses, and system configurations.
#
# Usage:
#   ./scripts/seed.sh                    # Seed via Docker container
#   ./scripts/seed.sh --direct           # Seed via direct psql connection
#   ./scripts/seed.sh --force            # Run even if DB already seeded
# =============================================================================

set -o errexit
set -o pipefail
set -o nounset

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()  { echo -e "\n${CYAN}══════════════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}\n"; }

FORCE=false; SEED_MODE="container"
for arg in "$@"; do
  case "$arg" in --force) FORCE=true;; --direct) SEED_MODE="direct";; esac
done

if [[ -f "${PROJECT_ROOT}/.env" ]]; then
  set -o allexport; source "${PROJECT_ROOT}/.env"; set +o allexport
else
  log_error ".env file not found. Run scripts/setup.sh first."; exit 1
fi

# Pre-computed bcrypt hash for 'admin123' (salt rounds=12)
BCRYPT_ADMIN='$2b$12$H4ybp/o49mYd9MTzgPAdjOB9nH5YT/bQPRiBlOnaHMJHQfDGWSz.q'

SEED_SQL=$(cat <<SEEDSQL
BEGIN;

-- ------------------------------------------------------------------
-- Departments (FEE specific)
-- ------------------------------------------------------------------
INSERT INTO app.departments (name_ar, name_en, code, faculty, description) VALUES
  ('هندسة الإلكترونيات والاتصالات', 'Electronics & Communication Engineering',   'EC',  'FE_ELECTRONIC_ENGINEERING', 'Electronic circuits and communication systems'),
  ('هندسة الحاسبات والنظم',          'Computer & Systems Engineering',           'CSE', 'FE_ELECTRONIC_ENGINEERING', 'Embedded systems and computer architecture'),
  ('الهندسة الطبية الحيوية',         'Biomedical Engineering',                   'BME', 'FE_ELECTRONIC_ENGINEERING', 'Medical device and bio-signal engineering')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------
-- Programs
-- ------------------------------------------------------------------
INSERT INTO app.programs (name_ar, name_en, code, duration, total_credits, degree, department_id)
SELECT
  p.name_ar, p.name_en, p.code, p.duration, p.total_credits, p.degree::app.programs_degree_enum, d.id
FROM (VALUES
  ('هندسة الإلكترونيات والاتصالات',     'Electronics & Communication Engineering',   'EC-BSC',  4, 160, 'BACHELOR', 'EC'),
  ('هندسة الحاسبات والنظم',            'Computer & Systems Engineering',           'CSE-BSC', 4, 160, 'BACHELOR', 'CSE'),
  ('الهندسة الطبية الحيوية',           'Biomedical Engineering',                   'BME-BSC', 4, 160, 'BACHELOR', 'BME')
) AS p(name_ar, name_en, code, duration, total_credits, degree, dept_code)
JOIN app.departments d ON d.code = p.dept_code
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------
-- Academic Years
-- ------------------------------------------------------------------
INSERT INTO app.academic_years (year, start_date, end_date, is_active) VALUES
  ('2024-2025', '2024-09-01', '2025-08-31', false),
  ('2025-2026', '2025-09-01', '2026-08-31', true)
ON CONFLICT (year) DO NOTHING;

-- ------------------------------------------------------------------
-- Semesters
-- ------------------------------------------------------------------
INSERT INTO app.semesters (name_ar, name_en, type, start_date, end_date, academic_year_id)
SELECT
    s.name_ar, s.name_en, s.type::app.semesters_type_enum, s.start_date::date, s.end_date::date, ay.id
FROM (VALUES
  ('الفصل الدراسي الأول 2024-2025', 'Fall Semester 2024-2025', 'FALL',   '2024-09-15', '2025-01-15', '2024-2025'),
  ('الفصل الدراسي الثاني 2024-2025','Spring Semester 2024-2025','SPRING', '2025-02-01', '2025-06-01', '2024-2025'),
  ('الفصل الدراسي الأول 2025-2026', 'Fall Semester 2025-2026', 'FALL',   '2025-09-15', '2026-01-15', '2025-2026')
) AS s(name_ar, name_en, type, start_date, end_date, year)
JOIN app.academic_years ay ON ay.year = s.year
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------
-- Users (all roles)
-- ------------------------------------------------------------------
-- Password for all users: admin123
INSERT INTO app.users (email, password, full_name_ar, full_name_en, role, phone, is_active, is_verified) VALUES
  ('admin@fee-menouf.edu.eg',   '${BCRYPT_ADMIN}', 'مدير النظام',          'System Admin',       'ADMIN',       '01000000001', true, true),
  ('head@fee-menouf.edu.eg',    '${BCRYPT_ADMIN}', 'رئيس القسم',           'Department Head',    'HEAD',        '01000000002', true, true),
  ('doctor@fee-menouf.edu.eg',  '${BCRYPT_ADMIN}', 'دكتور أحمد',           'Dr. Ahmed',          'DOCTOR',      '01000000003', true, true),
  ('doctor2@fee-menouf.edu.eg', '${BCRYPT_ADMIN}', 'دكتورة مريم',          'Dr. Mariam',         'DOCTOR',      '01000000004', true, true),
  ('ta@fee-menouf.edu.eg',      '${BCRYPT_ADMIN}', 'معيد أحمد',            'TA Ahmed',           'TA',          '01000000005', true, true),
  ('advisor@fee-menouf.edu.eg', '${BCRYPT_ADMIN}', 'مرشد أكاديمي',         'Academic Advisor',   'ADVISOR',     '01000000006', true, true),
  ('student@fee-menouf.edu.eg', '${BCRYPT_ADMIN}', 'طالب محمد',            'Mohamed Student',    'STUDENT',     '01000000007', true, true),
  ('student2@fee-menouf.edu.eg','${BCRYPT_ADMIN}', 'طالبة فاطمة',          'Fatima Student',     'STUDENT',     '01000000008', true, true),
  ('student3@fee-menouf.edu.eg','${BCRYPT_ADMIN}', 'طالب علي',             'Ali Student',        'STUDENT',     '01000000009', true, true)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  is_active = true;

INSERT INTO app.doctors (employee_id, title, department_id, user_id)
SELECT 'DOC0001', 'PROFESSOR'::app.doctors_title_enum, d.id, u.id
FROM app.users u, app.departments d
WHERE u.email = 'doctor@fee-menouf.edu.eg' AND d.code = 'EC'
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO app.doctors (employee_id, title, department_id, user_id)
SELECT 'DOC0002', 'ASSOCIATE'::app.doctors_title_enum, d.id, u.id
FROM app.users u, app.departments d
WHERE u.email = 'doctor2@fee-menouf.edu.eg' AND d.code = 'CSE'
ON CONFLICT (employee_id) DO NOTHING;

-- ------------------------------------------------------------------
-- TA profile
-- ------------------------------------------------------------------
INSERT INTO app.tas (employee_id, department_id, user_id)
SELECT 'TA0001', d.id, u.id
FROM app.users u, app.departments d
WHERE u.email = 'ta@fee-menouf.edu.eg' AND d.code = 'EC'
ON CONFLICT (employee_id) DO NOTHING;

-- ------------------------------------------------------------------
-- Advisor profile
-- ------------------------------------------------------------------
INSERT INTO app.advisors (employee_id, department_id, user_id)
SELECT 'ADV0001', d.id, u.id
FROM app.users u, app.departments d
WHERE u.email = 'advisor@fee-menouf.edu.eg' AND d.code = 'EC'
ON CONFLICT (employee_id) DO NOTHING;

-- ------------------------------------------------------------------
-- Student profiles
-- ------------------------------------------------------------------
INSERT INTO app.students (student_id, level, status, total_credits, gpa, cgpa, department_id, program_id, user_id)
SELECT
  s.sid, s.level, s.status::app.students_status_enum, s.credits::int, s.gpa::decimal, s.cgpa::decimal, dep.id, prog.id, u.id
FROM (VALUES
  ('20250001', 1, 'ACTIVE', 12, 2.85, 2.90, 'EC',  'EC-BSC', 'student@fee-menouf.edu.eg'),
  ('20250002', 1, 'ACTIVE', 12, 3.20, 3.15, 'CSE', 'CSE-BSC','student2@fee-menouf.edu.eg'),
  ('20250003', 1, 'ACTIVE', 12, 3.50, 3.45, 'BME', 'BME-BSC','student3@fee-menouf.edu.eg')
) AS s(sid, level, status, credits, gpa, cgpa, dept_code, prog_code, email)
JOIN app.departments dep ON dep.code = s.dept_code
JOIN app.programs prog ON prog.code = s.prog_code
JOIN app.users u ON u.email = s.email
ON CONFLICT (student_id) DO NOTHING;

-- ------------------------------------------------------------------
-- Courses
-- ------------------------------------------------------------------
INSERT INTO app.courses (code, name_ar, name_en, credits, lecture_hours, lab_hours, description, capacity, is_active, department_id)
SELECT
  c.code, c.name_ar, c.name_en, c.credits::int, c.lecture_hours::int, c.lab_hours::int, c.cdesc, c.capacity::int, true, dep.id
FROM (VALUES
  ('EC101', 'دوائر إلكترونية',      'Electronic Circuits',       3, 2, 2, 'Fundamentals of electronic circuits',    100, 'EC'),
  ('EC102', 'اتصالات رقمية',        'Digital Communications',    3, 2, 2, 'Principles of digital communication',     100, 'EC'),
  ('CSE101','برمجة حاسبات',         'Computer Programming',      3, 2, 2, 'Introduction to programming',             120, 'CSE'),
  ('CSE102','هندسة النظم',          'Systems Engineering',       3, 2, 2, 'Systems analysis and design',              80, 'CSE'),
  ('BME101','هندسة طبية حيوية',     'Biomedical Engineering',    3, 2, 2, 'Introduction to biomedical engineering',   80, 'BME'),
  ('BME102','إشارات طبية',          'Medical Signals',           3, 2, 2, 'Medical signal processing',                80, 'BME')
) AS c(code, name_ar, name_en, credits, lecture_hours, lab_hours, cdesc, capacity, dept_code)
JOIN app.departments dep ON dep.code = c.dept_code
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------
-- Course Registrations (enroll students in courses)
-- ------------------------------------------------------------------
INSERT INTO app.course_registrations (student_id, course_id, semester_id, status)
SELECT st.id, co.id, se.id, 'APPROVED'::app.course_registrations_status_enum
FROM app.students st
JOIN app.courses co ON co.department_id = st.department_id
CROSS JOIN app.semesters se
JOIN app.academic_years ay ON ay.id = se.academic_year_id
WHERE ay.is_active = true
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------
-- System configurations
-- ------------------------------------------------------------------
INSERT INTO app.configurations (key, value, description, is_encrypted) VALUES
  ('app.name',              '"FEE-MENOUF Smart University Platform"',       'Application display name',                false),
  ('app.version',           '"1.0.0"',                                       'Current platform version',                false),
  ('app.maintenance_mode',  'false',                                         'Enable maintenance mode (blocks logins)', false),
  ('auth.max_login_attempts','5',                                            'Max login attempts before lockout',       false),
  ('auth.password_min_length','8',                                           'Minimum password length requirement',     false),
  ('academic.semester',     '"2025-2026"',                                    'Current academic year/semester',          false),
  ('academic.grading_scale','{"A":90,"B":80,"C":70,"D":60,"F":0}',           'Grading scale thresholds',                false)
ON CONFLICT (key) DO NOTHING;

COMMIT;
SEEDSQL
)

# ---------------------------------------------------------------------------
# Check if already seeded
# ---------------------------------------------------------------------------
if [[ "$FORCE" != "true" ]]; then
  log_info "Checking if database is already seeded..."
  CHECK_SQL="SELECT COUNT(*) FROM app.users WHERE email = 'admin@fee-menouf.edu.eg';"
  ROW_COUNT=0

  if [[ "$SEED_MODE" == "container" ]]; then
    ROW_COUNT=$(docker compose -f "${PROJECT_ROOT}/docker-compose.local.yml" exec -T postgres \
      psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-fee_menouf_platform}" \
      -t -c "$CHECK_SQL" 2>/dev/null | tr -d '[:space:]') || ROW_COUNT=0
  else
    PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
      -t -c "$CHECK_SQL" 2>/dev/null | tr -d '[:space:]' || ROW_COUNT=0
  fi

  if [[ "$ROW_COUNT" -gt 0 ]]; then
    log_warn "Database already appears seeded (found admin user)."
    log_warn "Use --force to re-run."
    exit 0
  fi
fi

log_step "Seeding database"

if [[ "$SEED_MODE" == "container" ]]; then
  log_info "Executing seed via Docker container..."

  if ! docker compose -f "${PROJECT_ROOT}/docker-compose.local.yml" ps --services --filter "status=running" 2>/dev/null | grep -q "postgres"; then
    log_error "PostgreSQL container is not running. Start services first: docker compose -f docker-compose.local.yml up -d"
    exit 1
  fi

  echo "$SEED_SQL" | docker compose -f "${PROJECT_ROOT}/docker-compose.local.yml" exec -T postgres \
    psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-fee_menouf_platform}" -v ON_ERROR_STOP=1
elif [[ "$SEED_MODE" == "direct" ]]; then
  log_info "Executing seed via direct psql connection..."
  PGPASSWORD="${DB_PASS}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    -v ON_ERROR_STOP=1 <<< "$SEED_SQL"
fi

if [[ $? -eq 0 ]]; then
  log_info "Database seeded successfully."
  echo ""
  echo -e "  ${GREEN}Default logins (password for all: admin123):${NC}"
  echo -e "  ${YELLOW}Admin:${NC}   admin@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}Head:${NC}    head@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}Doctor:${NC}  doctor@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}Doctor2:${NC} doctor2@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}TA:${NC}      ta@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}Advisor:${NC} advisor@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}Student:${NC} student@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}Student2:${NC}student2@fee-menouf.edu.eg"
  echo -e "  ${YELLOW}Student3:${NC}student3@fee-menouf.edu.eg"
  echo ""
  log_warn "IMPORTANT: Change the default admin password immediately!"
else
  log_error "Seeding failed. Check error messages above."
  exit 1
fi
