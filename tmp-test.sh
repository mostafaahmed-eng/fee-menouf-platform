#!/bin/sh
BASE="http://localhost:4000/api/v1"
PASS=0
FAIL=0
RESULTS=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_result() {
  local test_name="$1"
  local expected="$2"
  local actual="$3"
  local detail="$4"
  
  if [ "$actual" = "$expected" ]; then
    PASS=$((PASS+1))
    RESULTS="${RESULTS}\n${GREEN}[PASS]${NC} $test_name (expected=$expected, got=$actual)"
  else
    FAIL=$((FAIL+1))
    RESULTS="${RESULTS}\n${RED}[FAIL]${NC} $test_name (expected=$expected, got=$actual)"
    if [ -n "$detail" ]; then
      RESULTS="${RESULTS}\n  -> $detail"
    fi
  fi
}

test_contains() {
  local test_name="$1"
  local needle="$2"
  local haystack="$3"
  
  if echo "$haystack" | grep -q "$needle"; then
    PASS=$((PASS+1))
    RESULTS="${RESULTS}\n${GREEN}[PASS]${NC} $test_name"
  else
    FAIL=$((FAIL+1))
    RESULTS="${RESULTS}\n${RED}[FAIL]${NC} $test_name (did not find '$needle' in response)"
  fi
}

echo "============================================"
echo "   COMPREHENSIVE API TEST SUITE"
echo "   Smart University Platform Backend"
echo "============================================"
echo ""

# ============================================================
# STEP 1: Health Check
# ============================================================
echo "--- Step 1: Health Check ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
test_result "GET /health" "200" "$HTTP_CODE"
echo ""

# ============================================================
# STEP 2: Login All Roles + Error Cases
# ============================================================
echo "--- Step 2: Authentication ---"

# Test login with wrong password
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@menouf.edu.eg","password":"wrongpassword"}')
test_result "POST /auth/login - wrong password" "401" "$HTTP_CODE"

# Test login with invalid email
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@menouf.edu.eg","password":"password123"}')
test_result "POST /auth/login - nonexistent email" "401" "$HTTP_CODE"

# Test login with empty body
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}')
test_result "POST /auth/login - empty body" "400" "$HTTP_CODE"

# Login all roles and capture tokens
login_role() {
  local role_name="$1"
  local email="$2"
  local password="$3"
  local outfile="$4"
  
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)
    REFRESH=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*"' | head -1 | cut -d'"' -f4)
    USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    ROLE=$(echo "$BODY" | grep -o '"role":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    echo "$TOKEN" > "$outfile.token"
    echo "$REFRESH" > "$outfile.refresh"
    echo "$USER_ID" > "$outfile.userid"
    echo "$ROLE" > "$outfile.role"
    
    test_result "POST /auth/login - $role_name ($email)" "200" "$HTTP_CODE"
  else
    test_result "POST /auth/login - $role_name ($email)" "200" "$HTTP_CODE" "Response: $BODY"
  fi
}

echo "Logging in all roles..."
login_role "SUPER_ADMIN" "superadmin@menouf.edu.eg" "password123" "/tmp/superadmin"
login_role "ADMIN" "admin@menouf.edu.eg" "password123" "/tmp/admin"
login_role "HEAD" "head@menouf.edu.eg" "password123" "/tmp/head"
login_role "DOCTOR" "doctor1@menouf.edu.eg" "password123" "/tmp/doctor"
login_role "TA" "ta1@menouf.edu.eg" "password123" "/tmp/ta"
login_role "ADVISOR" "advisor1@menouf.edu.eg" "password123" "/tmp/advisor"
login_role "STUDENT" "student1@menouf.edu.eg" "password123" "/tmp/student"

SA_TOK=$(cat /tmp/superadmin.token)
AD_TOK=$(cat /tmp/admin.token)
HD_TOK=$(cat /tmp/head.token)
DR_TOK=$(cat /tmp/doctor.token)
TA_TOK=$(cat /tmp/ta.token)
AV_TOK=$(cat /tmp/advisor.token)
ST_TOK=$(cat /tmp/student.token)
SA_UID=$(cat /tmp/superadmin.userid)
AD_UID=$(cat /tmp/admin.userid)
DR_UID=$(cat /tmp/doctor.userid)
ST_UID=$(cat /tmp/student.userid)
AV_UID=$(cat /tmp/advisor.userid)

echo ""

# Test refresh token
SA_REFRESH=$(cat /tmp/superadmin.refresh)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$SA_REFRESH\"}")
test_result "POST /auth/refresh - valid refresh token" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"invalid.refresh.token.here"}')
test_result "POST /auth/refresh - invalid refresh token" "401" "$HTTP_CODE"

echo ""

# Test profile for each role
for ROLE_FILE in superadmin admin head doctor ta advisor student; do
  ROLE_NAME=$(echo "$ROLE_FILE" | tr '[:lower:]' '[:upper:]')
  ROLE_TOK=$(cat "/tmp/${ROLE_FILE}.token")
  RESP=$(curl -s -w "\n%{http_code}" "$BASE/auth/profile" \
    -H "Authorization: Bearer $ROLE_TOK")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  test_result "GET /auth/profile - $ROLE_NAME" "200" "$HTTP_CODE"
done

echo ""

# Test profile without token
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/profile")
test_result "GET /auth/profile - no token" "401" "$HTTP_CODE"

# Test profile with invalid token
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/profile" \
  -H "Authorization: Bearer invalid.token.value")
test_result "GET /auth/profile - invalid token" "401" "$HTTP_CODE"

echo ""

# Test change password
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/change-password" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"wrongpass","newPassword":"newpassword123"}')
test_result "POST /auth/change-password - wrong current password" "400" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/change-password" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"password123","newPassword":"newpassword123"}')
test_result "POST /auth/change-password - correct current password" "200" "$HTTP_CODE"

# Change it back
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/change-password" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"newpassword123","newPassword":"password123"}')
test_result "POST /auth/change-password - change back" "200" "$HTTP_CODE"

echo ""

# Test register - valid data
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"testregister@example.com","password":"testpass123","fullNameAr":"تست مسجل","fullNameEn":"Test Register","role":"STUDENT"}')
test_result "POST /auth/register - valid student registration" "201" "$HTTP_CODE"

# Test register - duplicate email
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"testregister@example.com","password":"testpass123","fullNameAr":"تست مسجل","fullNameEn":"Test Register","role":"STUDENT"}')
test_result "POST /auth/register - duplicate email" "409" "$HTTP_CODE"

# Test register - SUPER_ADMIN role (should fail)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@example.com","password":"testpass123","fullNameAr":"تست","fullNameEn":"Test","role":"SUPER_ADMIN"}')
test_result "POST /auth/register - SUPER_ADMIN role (forbidden)" "400" "$HTTP_CODE"

# Test register - missing fields
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}')
test_result "POST /auth/register - missing required fields" "400" "$HTTP_CODE"

# Test register - invalid email
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"testpass123","fullNameAr":"تست","fullNameEn":"Test","role":"STUDENT"}')
test_result "POST /auth/register - invalid email format" "400" "$HTTP_CODE"

echo ""
echo "--- Step 3: Authorization Tests (No Token / Wrong Role) ---"

# Test protected endpoints without token
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users")
test_result "GET /users - no token" "401" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses")
test_result "GET /courses - no token" "401" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students")
test_result "GET /students - no token" "401" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/notifications")
test_result "GET /notifications - no token" "401" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/exams")
test_result "GET /exams - no token" "401" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/grades/student/00000000-0000-0000-0000-000000000000")
test_result "GET /grades/student/:id - no token" "401" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/registration/pending")
test_result "GET /registration/pending - no token" "401" "$HTTP_CODE"

echo ""

# Test role restrictions
# Students should NOT be able to create courses
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/courses" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST101","nameAr":"اختبار","nameEn":"Test","credits":3}')
test_result "POST /courses - STUDENT role (should be 403)" "403" "$HTTP_CODE"

# Students should NOT be able to create users
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/users" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","fullNameAr":"تست","fullNameEn":"Test","role":"STUDENT"}')
test_result "POST /users - STUDENT role (should be 403)" "403" "$HTTP_CODE"

# Students should NOT be able to delete users
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $ST_TOK")
test_result "DELETE /users/:id - STUDENT role (should be 403)" "403" "$HTTP_CODE"

# Doctor should NOT be able to create courses
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/courses" \
  -H "Authorization: Bearer $DR_TOK" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST102","nameAr":"اختبار2","nameEn":"Test2","credits":3}')
test_result "POST /courses - DOCTOR role (should be 403)" "403" "$HTTP_CODE"

# Non-SUPER_ADMIN should NOT delete users
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $AD_TOK")
test_result "DELETE /users/:id - ADMIN role (should be 403)" "403" "$HTTP_CODE"

# Non-admin should NOT create exams
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/exams" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Exam"}')
test_result "POST /exams - STUDENT role (should be 403)" "403" "$HTTP_CODE"

# TA should NOT publish grades (only DOCTOR, ADMIN)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/grades/publish/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TA_TOK")
test_result "POST /grades/publish/:courseId - TA role (should be 403)" "403" "$HTTP_CODE"

# Non-ADVISOR should NOT see pending registrations
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/registration/pending" \
  -H "Authorization: Bearer $ST_TOK")
test_result "GET /registration/pending - STUDENT role (should be 403)" "403" "$HTTP_CODE"

# Doctor should NOT be able to create notifications (only ADMIN/SUPER_ADMIN)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/notifications" \
  -H "Authorization: Bearer $DR_TOK" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$SA_UID\",\"type\":\"SYSTEM\",\"title\":\"Test\",\"message\":\"Test\"}")
test_result "POST /notifications - DOCTOR role (should be 403)" "403" "$HTTP_CODE"

# Non-ADMIN should NOT create departments
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/departments" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Department","nameAr":"قسم اختبار"}')
test_result "POST /departments - STUDENT role (should be 403)" "403" "$HTTP_CODE"

# Non-SUPER_ADMIN should NOT delete courses
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/courses/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $AD_TOK")
test_result "DELETE /courses/:id - ADMIN role (should be 403)" "403" "$HTTP_CODE"

# Doctor should NOT delete exams
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/exams/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $DR_TOK")
test_result "DELETE /exams/:id - DOCTOR role (should be 403)" "403" "$HTTP_CODE"

# Students should NOT upload files
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/files/upload" \
  -H "Authorization: Bearer $ST_TOK" \
  -F "file=@/dev/null;filename=test.txt" \
  -F "uploadedBy=$ST_UID" \
  -F "description=test")
test_result "POST /files/upload - STUDENT role (should be 403)" "403" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 4: CRUD - Users
# ============================================================
echo "--- Step 4: Users CRUD ---"

# GET /users (ADMIN)
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users" -H "Authorization: Bearer $AD_TOK")
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "GET /users - ADMIN" "200" "$HTTP_CODE"

# GET /users (SUPER_ADMIN)
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users" -H "Authorization: Bearer $SA_TOK")
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "GET /users - SUPER_ADMIN" "200" "$HTTP_CODE"

# GET /users (HEAD)
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users" -H "Authorization: Bearer $HD_TOK")
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "GET /users - HEAD" "200" "$HTTP_CODE"

# GET /users (STUDENT - should fail)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users" -H "Authorization: Bearer $ST_TOK")
test_result "GET /users - STUDENT (should be 403)" "403" "$HTTP_CODE"

# POST /users - create user
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/users" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"email":"createduser@test.com","password":"pass123456","fullNameAr":"مستخدم مُنشأ","fullNameEn":"Created User","role":"DOCTOR"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
NEW_USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /users - ADMIN create user" "201" "$HTTP_CODE"

# PATCH /users/:id
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"fullNameEn":"Updated User Name"}')
test_result "PATCH /users/:id - ADMIN update user" "200" "$HTTP_CODE"

# POST /users/:id/toggle-active
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/users/$NEW_USER_ID/toggle-active" \
  -H "Authorization: Bearer $AD_TOK")
test_result "POST /users/:id/toggle-active - toggle" "200" "$HTTP_CODE"

# DELETE /users/:id - only SUPER_ADMIN
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $SA_TOK")
test_result "DELETE /users/:id - SUPER_ADMIN delete" "200" "$HTTP_CODE"

# GET /users - pagination
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users?page=1&limit=2" -H "Authorization: Bearer $AD_TOK")
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "GET /users?page=1&limit=2 - pagination" "200" "$HTTP_CODE"

# GET /users - filter by role
RESP=$(curl -s -w "\n%{http_code}" "$BASE/users?role=DOCTOR" -H "Authorization: Bearer $AD_TOK")
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "GET /users?role=DOCTOR - filter" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 5: CRUD - Courses
# ============================================================
echo "--- Step 5: Courses CRUD ---"

# GET /courses (all authenticated users)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses - STUDENT" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses" -H "Authorization: Bearer $DR_TOK")
test_result "GET /courses - DOCTOR" "200" "$HTTP_CODE"

# POST /courses - create (ADMIN)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/courses" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"code":"QA101","nameAr":"اختبار جودة البرمجيات","nameEn":"QA Testing","credits":3,"capacity":50}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
COURSE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /courses - ADMIN create course" "201" "$HTTP_CODE"

# GET /courses/:id
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/$COURSE_ID" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses/:id - single course" "200" "$HTTP_CODE"

# PATCH /courses/:id
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/courses/$COURSE_ID" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"nameEn":"QA Testing Updated"}')
test_result "PATCH /courses/:id - update" "200" "$HTTP_CODE"

# GET /courses/:id/prerequisites
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/$COURSE_ID/prerequisites" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses/:id/prerequisites" "200" "$HTTP_CODE"

# GET /courses/:id/materials
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/$COURSE_ID/materials" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses/:id/materials" "200" "$HTTP_CODE"

# GET /courses/:id/announcements
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/$COURSE_ID/announcements" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses/:id/announcements" "200" "$HTTP_CODE"

# DELETE /courses/:id - SUPER_ADMIN only
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/courses/$COURSE_ID" \
  -H "Authorization: Bearer $SA_TOK")
test_result "DELETE /courses/:id - SUPER_ADMIN delete" "200" "$HTTP_CODE"

# Re-create course for other tests
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/courses" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"code":"QA102","nameAr":"اختبار جودة البرمجيات 2","nameEn":"QA Testing 2","credits":3,"capacity":50}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
COURSE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /courses - re-create course for further tests" "201" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 6: Students
# ============================================================
echo "--- Step 6: Students ---"

# GET /students (ADMIN)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students" -H "Authorization: Bearer $AD_TOK")
test_result "GET /students - ADMIN" "200" "$HTTP_CODE"

# GET /students (DOCTOR)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students" -H "Authorization: Bearer $DR_TOK")
test_result "GET /students - DOCTOR" "200" "$HTTP_CODE"

# GET /students - pagination
RESP=$(curl -s -w "\n%{http_code}" "$BASE/students?page=1&limit=2" -H "Authorization: Bearer $AD_TOK")
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "GET /students?page=1&limit=2 - pagination" "200" "$HTTP_CODE"

# Find student ID from student1
RESP=$(curl -s "$BASE/auth/profile" -H "Authorization: Bearer $ST_TOK")
STUDENT_DB_ID=$(echo "$RESP" | grep -o '"student":{[^}]*}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$STUDENT_DB_ID" ]; then
  # GET /students/:id
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students/$STUDENT_DB_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /students/:id - get student" "200" "$HTTP_CODE"
  
  # GET /students/:id/grades
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students/$STUDENT_DB_ID/grades" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /students/:id/grades" "200" "$HTTP_CODE"
  
  # GET /students/:id/attendance
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students/$STUDENT_DB_ID/attendance" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /students/:id/attendance" "200" "$HTTP_CODE"
  
  # GET /students/:id/registrations
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students/$STUDENT_DB_ID/registrations" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /students/:id/registrations" "200" "$HTTP_CODE"
else
  echo "${YELLOW}  Skipping student detail tests - no student ID found${NC}"
fi

echo ""

# ============================================================
# STEP 7: Attendance
# ============================================================
echo "--- Step 7: Attendance ---"

# GET /attendance/student/:studentId
if [ -n "$STUDENT_DB_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/attendance/student/$STUDENT_DB_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /attendance/student/:id" "200" "$HTTP_CODE"
fi

# GET /attendance/course/:courseId (DOCTOR)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/attendance/course/$COURSE_ID" -H "Authorization: Bearer $DR_TOK")
test_result "GET /attendance/course/:courseId - DOCTOR" "200" "$HTTP_CODE"

# GET /attendance/course/:courseId (STUDENT - should be 403)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/attendance/course/$COURSE_ID" -H "Authorization: Bearer $ST_TOK")
test_result "GET /attendance/course/:courseId - STUDENT (should be 403)" "403" "$HTTP_CODE"

# POST /attendance/mark (DOCTOR)
if [ -n "$STUDENT_DB_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/attendance/mark" \
    -H "Authorization: Bearer $DR_TOK" \
    -H "Content-Type: application/json" \
    -d "{\"studentId\":\"$STUDENT_DB_ID\",\"courseId\":\"$COURSE_ID\",\"lectureId\":\"00000000-0000-0000-0000-000000000000\",\"status\":\"PRESENT\"}")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  test_result "POST /attendance/mark - DOCTOR" "201" "$HTTP_CODE"
fi

# POST /attendance/mark-bulk
if [ -n "$STUDENT_DB_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/attendance/mark-bulk" \
    -H "Authorization: Bearer $DR_TOK" \
    -H "Content-Type: application/json" \
    -d "{\"courseId\":\"$COURSE_ID\",\"records\":[{\"studentId\":\"$STUDENT_DB_ID\",\"status\":\"LATE\",\"date\":\"2026-07-10\"}]}")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  test_result "POST /attendance/mark-bulk - DOCTOR" "201" "$HTTP_CODE"
fi

# POST /attendance/mark - STUDENT (should be 403)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/attendance/mark" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"studentId":"00000000-0000-0000-0000-000000000000","courseId":"00000000-0000-0000-0000-000000000000","lectureId":"00000000-0000-0000-0000-000000000000","status":"PRESENT"}')
test_result "POST /attendance/mark - STUDENT (should be 403)" "403" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 8: Grades
# ============================================================
echo "--- Step 8: Grades ---"

# GET /grades/student/:studentId
if [ -n "$STUDENT_DB_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/grades/student/$STUDENT_DB_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /grades/student/:id - STUDENT" "200" "$HTTP_CODE"
fi

# GET /grades/course/:courseId (DOCTOR)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/grades/course/$COURSE_ID" -H "Authorization: Bearer $DR_TOK")
test_result "GET /grades/course/:courseId - DOCTOR" "200" "$HTTP_CODE"

# GET /grades/transcript/:studentId
if [ -n "$STUDENT_DB_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/grades/transcript/$STUDENT_DB_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /grades/transcript/:studentId" "200" "$HTTP_CODE"
fi

# POST /grades - DOCTOR
if [ -n "$STUDENT_DB_ID" ]; then
  # Need semesterId - try to get from academic
  SEMESTER_RESP=$(curl -s "$BASE/academic/semesters" -H "Authorization: Bearer $AD_TOK")
  SEMESTER_ID=$(echo "$SEMESTER_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$SEMESTER_ID" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/grades" \
      -H "Authorization: Bearer $DR_TOK" \
      -H "Content-Type: application/json" \
      -d "{\"studentId\":\"$STUDENT_DB_ID\",\"courseId\":\"$COURSE_ID\",\"semesterId\":\"$SEMESTER_ID\",\"component\":\"MIDTERM\",\"score\":85,\"maxScore\":100,\"weight\":0.3}")
    HTTP_CODE=$(echo "$RESP" | tail -1)
    BODY=$(echo "$RESP" | sed '$d')
    GRADE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    test_result "POST /grades - DOCTOR create grade" "201" "$HTTP_CODE"
    
    # PATCH /grades/:id
    if [ -n "$GRADE_ID" ]; then
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/grades/$GRADE_ID" \
        -H "Authorization: Bearer $DR_TOK" \
        -H "Content-Type: application/json" \
        -d '{"score":90}')
      test_result "PATCH /grades/:id - update grade" "200" "$HTTP_CODE"
    fi
    
    # POST /grades/publish/:courseId
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/grades/publish/$COURSE_ID" \
      -H "Authorization: Bearer $DR_TOK")
    test_result "POST /grades/publish/:courseId - DOCTOR" "200" "$HTTP_CODE"
  else
    echo "${YELLOW}  Skipping grade create tests - no semester found${NC}"
  fi
fi

echo ""

# ============================================================
# STEP 9: Exams
# ============================================================
echo "--- Step 9: Exams ---"

# GET /exams
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/exams" -H "Authorization: Bearer $ST_TOK")
test_result "GET /exams" "200" "$HTTP_CODE"

# POST /exams (ADMIN)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/exams" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"name":"QA Midterm Exam","type":"MIDTERM","courseId":"'$COURSE_ID'"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
EXAM_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /exams - ADMIN create exam" "201" "$HTTP_CODE"

# GET /exams/:id
if [ -n "$EXAM_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/exams/$EXAM_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /exams/:id" "200" "$HTTP_CODE"
  
  # PATCH /exams/:id
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/exams/$EXAM_ID" \
    -H "Authorization: Bearer $AD_TOK" \
    -H "Content-Type: application/json" \
    -d '{"name":"QA Midterm Exam Updated"}')
  test_result "PATCH /exams/:id - ADMIN update" "200" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 10: Notifications
# ============================================================
echo "--- Step 10: Notifications ---"

# GET /notifications
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/notifications" -H "Authorization: Bearer $ST_TOK")
test_result "GET /notifications - STUDENT" "200" "$HTTP_CODE"

# GET /notifications/unread-count
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/notifications/unread-count" -H "Authorization: Bearer $ST_TOK")
test_result "GET /notifications/unread-count" "200" "$HTTP_CODE"

# POST /notifications (ADMIN create)
NOTIF_RESP=$(curl -s -X POST "$BASE/notifications" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$ST_UID\",\"type\":\"SYSTEM\",\"title\":\"Test Notification\",\"message\":\"This is a test\"}")
NOTIF_ID=$(echo "$NOTIF_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NOTIF_ID" ]; then
  # POST /notifications/:id/read
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/notifications/$NOTIF_ID/read" \
    -H "Authorization: Bearer $ST_TOK")
  test_result "POST /notifications/:id/read" "200" "$HTTP_CODE"
else
  echo "${YELLOW}  Skipping notification mark-read test - no notification ID${NC}"
fi

# POST /notifications/mark-all-read
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/notifications/mark-all-read" \
  -H "Authorization: Bearer $ST_TOK")
test_result "POST /notifications/mark-all-read" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 11: Files
# ============================================================
echo "--- Step 11: Files ---"

# Create a temp file for upload
echo "test content" > /tmp/test-upload.txt

# POST /files/upload (DOCTOR)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/files/upload" \
  -H "Authorization: Bearer $DR_TOK" \
  -F "file=@/tmp/test-upload.txt" \
  -F "uploadedBy=$DR_UID" \
  -F "description=Test upload")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
FILE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /files/upload - DOCTOR" "200" "$HTTP_CODE"

# GET /files/:id
if [ -n "$FILE_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/files/$FILE_ID" -H "Authorization: Bearer $DR_TOK")
  test_result "GET /files/:id - metadata" "200" "$HTTP_CODE"
fi

# POST /files/upload - STUDENT (should be 403)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/files/upload" \
  -H "Authorization: Bearer $ST_TOK" \
  -F "file=@/tmp/test-upload.txt" \
  -F "uploadedBy=$ST_UID" \
  -F "description=Test upload")
test_result "POST /files/upload - STUDENT (should be 403)" "403" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 12: Registration
# ============================================================
echo "--- Step 12: Registration ---"

# First find a student that has a DB record
REG_STUDENT_RESP=$(curl -s "$BASE/students?page=1&limit=1" -H "Authorization: Bearer $AD_TOK")
REG_STUDENT_ID=$(echo "$REG_STUDENT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
REG_STUDENT_USERID=$(echo "$REG_STUDENT_RESP" | grep -o '"userId":"[^"]*"' | head -1 | cut -d'"' -f4)

# Get semester
SEMESTER_RESP2=$(curl -s "$BASE/academic/semesters" -H "Authorization: Bearer $AD_TOK")
REG_SEMESTER_ID=$(echo "$SEMESTER_RESP2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$REG_STUDENT_ID" ] && [ -n "$REG_SEMESTER_ID" ] && [ -n "$COURSE_ID" ]; then
  # GET /registration/pending (ADVISOR)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/registration/pending" -H "Authorization: Bearer $AV_TOK")
  test_result "GET /registration/pending - ADVISOR" "200" "$HTTP_CODE"

  # GET /registration/student/:studentId
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/registration/student/$REG_STUDENT_ID" -H "Authorization: Bearer $AV_TOK")
  test_result "GET /registration/student/:id" "200" "$HTTP_CODE"

  # POST /registration/register
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/registration/register" \
    -H "Authorization: Bearer $ST_TOK" \
    -H "Content-Type: application/json" \
    -d "{\"studentId\":\"$REG_STUDENT_ID\",\"semesterId\":\"$REG_SEMESTER_ID\",\"courseIds\":[\"$COURSE_ID\"]}")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  REG_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  test_result "POST /registration/register - student enroll" "201" "$HTTP_CODE"

  # Try duplicate registration
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/registration/register" \
    -H "Authorization: Bearer $ST_TOK" \
    -H "Content-Type: application/json" \
    -d "{\"studentId\":\"$REG_STUDENT_ID\",\"semesterId\":\"$REG_SEMESTER_ID\",\"courseIds\":[\"$COURSE_ID\"]}")
  test_result "POST /registration/register - duplicate (should be 409)" "409" "$HTTP_CODE"

  if [ -n "$REG_ID" ]; then
    # PATCH /registration/approve/:id
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/registration/approve/$REG_ID" \
      -H "Authorization: Bearer $AV_TOK")
    test_result "PATCH /registration/approve/:id - ADVISOR" "200" "$HTTP_CODE"
  fi
else
  echo "${YELLOW}  Skipping some registration tests - missing IDs (student=$REG_STUDENT_ID, semester=$REG_SEMESTER_ID, course=$COURSE_ID)${NC}"
fi

echo ""

# ============================================================
# STEP 13: Departments
# ============================================================
echo "--- Step 13: Departments ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/departments" -H "Authorization: Bearer $ST_TOK")
test_result "GET /departments - STUDENT" "200" "$HTTP_CODE"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/departments" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"name":"QA Department","nameAr":"قسم ضمان الجودة","faculty":"ENGINEERING"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
DEPT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /departments - ADMIN" "201" "$HTTP_CODE"

if [ -n "$DEPT_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/departments/$DEPT_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /departments/:id" "200" "$HTTP_CODE"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/departments/$DEPT_ID" \
    -H "Authorization: Bearer $AD_TOK" \
    -H "Content-Type: application/json" \
    -d '{"name":"QA Department Updated"}')
  test_result "PATCH /departments/:id - ADMIN" "200" "$HTTP_CODE"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/departments/$DEPT_ID/statistics" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /departments/:id/statistics" "200" "$HTTP_CODE"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/departments/$DEPT_ID" \
    -H "Authorization: Bearer $SA_TOK")
  test_result "DELETE /departments/:id - SUPER_ADMIN" "200" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 14: Classrooms
# ============================================================
echo "--- Step 14: Classrooms ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/classrooms" -H "Authorization: Bearer $ST_TOK")
test_result "GET /classrooms - STUDENT" "200" "$HTTP_CODE"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/classrooms" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"name":"QA Lab","building":"Building A","floor":1,"capacity":40,"type":"LABORATORY"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
CLASS_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /classrooms - ADMIN" "201" "$HTTP_CODE"

if [ -n "$CLASS_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/classrooms/$CLASS_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /classrooms/:id" "200" "$HTTP_CODE"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/classrooms/$CLASS_ID" \
    -H "Authorization: Bearer $AD_TOK" \
    -H "Content-Type: application/json" \
    -d '{"capacity":50}')
  test_result "PATCH /classrooms/:id - ADMIN" "200" "$HTTP_CODE"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/classrooms/available" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /classrooms/available" "200" "$HTTP_CODE"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/classrooms/$CLASS_ID" \
    -H "Authorization: Bearer $SA_TOK")
  test_result "DELETE /classrooms/:id - SUPER_ADMIN" "200" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 15: Doctors
# ============================================================
echo "--- Step 15: Doctors ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/doctors" -H "Authorization: Bearer $DR_TOK")
test_result "GET /doctors - DOCTOR" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/doctors" -H "Authorization: Bearer $AD_TOK")
test_result "GET /doctors - ADMIN" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 16: Schedule
# ============================================================
echo "--- Step 16: Schedule ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/schedule" -H "Authorization: Bearer $ST_TOK")
test_result "GET /schedule - STUDENT" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/scheduling/lecture-schedule" -H "Authorization: Bearer $ST_TOK")
test_result "GET /scheduling/lecture-schedule" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/scheduling/exam-schedule" -H "Authorization: Bearer $ST_TOK")
test_result "GET /scheduling/exam-schedule" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 17: Academic
# ============================================================
echo "--- Step 17: Academic ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/academic/years" -H "Authorization: Bearer $ST_TOK")
test_result "GET /academic/years" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/academic/years/active" -H "Authorization: Bearer $ST_TOK")
test_result "GET /academic/years/active" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/academic/semesters" -H "Authorization: Bearer $ST_TOK")
test_result "GET /academic/semesters" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/academic/semesters/active" -H "Authorization: Bearer $ST_TOK")
test_result "GET /academic/semesters/active" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 18: Materials
# ============================================================
echo "--- Step 18: Materials ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/materials/course/$COURSE_ID" -H "Authorization: Bearer $ST_TOK")
test_result "GET /materials/course/:courseId" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 19: Search
# ============================================================
echo "--- Step 19: Search ---"

# search endpoint has no auth guard - check if it's public or needs auth
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/search?q=test")
test_result "GET /search?q=test - public" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/search/advanced?query=test")
test_result "GET /search/advanced?q=test - public" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 20: Analytics
# ============================================================
echo "--- Step 20: Analytics ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/analytics/enrollment-trends" -H "Authorization: Bearer $AD_TOK")
test_result "GET /analytics/enrollment-trends" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/analytics/failure-rates" -H "Authorization: Bearer $AD_TOK")
test_result "GET /analytics/failure-rates" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/analytics/graduation-stats" -H "Authorization: Bearer $AD_TOK")
test_result "GET /analytics/graduation-stats" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/analytics/faculty-workload" -H "Authorization: Bearer $AD_TOK")
test_result "GET /analytics/faculty-workload" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 21: Reports
# ============================================================
echo "--- Step 21: Reports ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/reports/registration/active" -H "Authorization: Bearer $AD_TOK")
test_result "GET /reports/registration/active" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/reports/grades/$COURSE_ID" -H "Authorization: Bearer $AD_TOK")
test_result "GET /reports/grades/:courseId" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/reports/attendance/$COURSE_ID" -H "Authorization: Bearer $AD_TOK")
test_result "GET /reports/attendance/:courseId" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 22: QR Codes
# ============================================================
echo "--- Step 22: QR Codes ---"

# QR endpoints appear to have no auth guard
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/qr/generate" \
  -H "Content-Type: application/json" \
  -d '{"lectureId":"00000000-0000-0000-0000-000000000000","expiryMinutes":5}')
test_result "POST /qr/generate - no auth guard" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 23: Validation Tests
# ============================================================
echo "--- Step 23: Validation ---"

# Invalid email on register
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"pass123","fullNameAr":"test","fullNameEn":"test","role":"STUDENT"}')
test_result "POST /auth/register - invalid email format" "400" "$HTTP_CODE"

# Missing password
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"valid@test.com","fullNameAr":"test","fullNameEn":"test","role":"STUDENT"}')
test_result "POST /auth/register - missing password" "400" "$HTTP_CODE"

# Invalid role on register
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"valid@test.com","password":"pass123","fullNameAr":"test","fullNameEn":"test","role":"INVALID_ROLE"}')
test_result "POST /auth/register - invalid role" "400" "$HTTP_CODE"

# Invalid UUID on course
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/not-a-uuid" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses/:id - invalid UUID" "400" "$HTTP_CODE"

# Invalid UUID on student
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students/not-a-uuid" -H "Authorization: Bearer $AD_TOK")
test_result "GET /students/:id - invalid UUID" "400" "$HTTP_CODE"

# Create course missing required fields
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/courses" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{}')
test_result "POST /courses - empty body" "400" "$HTTP_CODE"

# Create user missing required fields
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/users" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{}')
test_result "POST /users - empty body" "400" "$HTTP_CODE"

# Login with short password
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"ab"}')
test_result "POST /auth/login - password too short" "400" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 24: Edge Cases
# ============================================================
echo "--- Step 24: Edge Cases ---"

# Non-existent ID
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/students/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $AD_TOK")
test_result "GET /students/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/users/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $AD_TOK")
test_result "GET /users/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/exams/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $ST_TOK")
test_result "GET /exams/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/departments/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $ST_TOK")
test_result "GET /departments/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

# DELETE nonexistent resource
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $SA_TOK")
test_result "DELETE /users/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/departments/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $SA_TOK")
test_result "DELETE /departments/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/classrooms/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $SA_TOK")
test_result "DELETE /classrooms/:nonexistent-id - should return 404" "404" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 25: Logout & Token Invalidation
# ============================================================
echo "--- Step 25: Logout & Token Invalidation ---"

# Create a temp user to test logout
REG_RESP=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"logout-test@example.com","password":"testpass123","fullNameAr":"اختبار خروج","fullNameEn":"Logout Test","role":"STUDENT"}')
LOGOUT_TOK=$(echo "$REG_RESP" | grep -o '"accessToken":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$LOGOUT_TOK" ]; then
  # Logout
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/logout" \
    -H "Authorization: Bearer $LOGOUT_TOK")
  test_result "POST /auth/logout" "200" "$HTTP_CODE"
  
  # After logout, token should be invalid for profile (but still valid JWT until expiry)
  # Actually the refresh token is cleared, so refresh should fail
  LOGOUT_REFRESH=$(echo "$REG_RESP" | grep -o '"refreshToken":"[^"]*"' | head -1 | cut -d'"' -f4)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/refresh" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\":\"$LOGOUT_REFRESH\"}")
  test_result "POST /auth/refresh - after logout (should fail)" "401" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 26: Courses - Additional Endpoints
# ============================================================
echo "--- Step 26: Course Additional Endpoints ---"

# POST /courses/:id/announcements (DOCTOR)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/courses/$COURSE_ID/announcements" \
  -H "Authorization: Bearer $DR_TOK" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Announcement","content":"This is a test announcement"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "POST /courses/:id/announcements - DOCTOR" "201" "$HTTP_CODE"

# GET /courses/:id/schedule
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/$COURSE_ID/schedule" -H "Authorization: Bearer $ST_TOK")
test_result "GET /courses/:id/schedule" "200" "$HTTP_CODE"

# GET /courses/:id/students (ADMIN)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/courses/$COURSE_ID/students" -H "Authorization: Bearer $AD_TOK")
test_result "GET /courses/:id/students - ADMIN" "200" "$HTTP_CODE"

# POST /courses/:id/materials (DOCTOR)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/courses/$COURSE_ID/materials" \
  -H "Authorization: Bearer $DR_TOK" \
  -F "file=@/tmp/test-upload.txt" \
  -F "title=Test Material" \
  -F "type=LECTURE")
HTTP_CODE=$(echo "$RESP" | tail -1)
test_result "POST /courses/:id/materials - DOCTOR upload" "201" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 27: Bulk Grades
# ============================================================
echo "--- Step 27: Bulk Grades ---"

if [ -n "$STUDENT_DB_ID" ] && [ -n "$SEMESTER_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/grades/bulk" \
    -H "Authorization: Bearer $DR_TOK" \
    -H "Content-Type: application/json" \
    -d "{\"grades\":[{\"studentId\":\"$STUDENT_DB_ID\",\"courseId\":\"$COURSE_ID\",\"semesterId\":\"$SEMESTER_ID\",\"component\":\"FINAL\",\"score\":88,\"maxScore\":100,\"weight\":0.5}]}")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  test_result "POST /grades/bulk - DOCTOR" "201" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 28: Doctor Dashboard
# ============================================================
echo "--- Step 28: Doctor Dashboard ---"

# Get doctor ID
DR_RESP=$(curl -s "$BASE/doctors" -H "Authorization: Bearer $DR_TOK")
DR_DOC_ID=$(echo "$DR_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$DR_DOC_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/doctors/$DR_DOC_ID/dashboard" -H "Authorization: Bearer $DR_TOK")
  test_result "GET /doctors/:id/dashboard" "200" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 29: Auth /users endpoint (admin-only list)
# ============================================================
echo "--- Step 29: Auth Users Endpoint ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/users" -H "Authorization: Bearer $AD_TOK")
test_result "GET /auth/users - ADMIN" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/users" -H "Authorization: Bearer $ST_TOK")
test_result "GET /auth/users - STUDENT (should be 403)" "403" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 30: Notifications - Admin create + edge cases
# ============================================================
echo "--- Step 30: Notifications Edge Cases ---"

# Create notification
NOTIF_RESP2=$(curl -s -w "\n%{http_code}" -X POST "$BASE/notifications" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$ST_UID\",\"type\":\"SYSTEM\",\"title\":\"Edge Test\",\"message\":\"Edge case test\"}")
HTTP_CODE=$(echo "$NOTIF_RESP2" | tail -1)
test_result "POST /notifications - ADMIN create" "201" "$HTTP_CODE"

# DELETE /notifications/:id
NOTIF_RESP3=$(curl -s -X POST "$BASE/notifications" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$ST_UID\",\"type\":\"SYSTEM\",\"title\":\"Delete Test\",\"message\":\"Delete this\"}")
DEL_NOTIF_ID=$(echo "$NOTIF_RESP3" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$DEL_NOTIF_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/notifications/$DEL_NOTIF_ID" \
    -H "Authorization: Bearer $ST_TOK")
  test_result "DELETE /notifications/:id" "200" "$HTTP_CODE"
fi

# DELETE /notifications (clear all)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/notifications" \
  -H "Authorization: Bearer $ST_TOK")
test_result "DELETE /notifications - clear all" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 31: Exam Schedules
# ============================================================
echo "--- Step 31: Exam Schedules ---"

if [ -n "$EXAM_ID" ]; then
  # POST /exams/:examId/schedules
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/exams/$EXAM_ID/schedules" \
    -H "Authorization: Bearer $AD_TOK" \
    -H "Content-Type: application/json" \
    -d '{"date":"2026-09-01","startTime":"09:00","endTime":"12:00","roomId":"00000000-0000-0000-0000-000000000000"}')
  HTTP_CODE=$(echo "$RESP" | tail -1)
  test_result "POST /exams/:examId/schedules" "201" "$HTTP_CODE"
  
  # GET /exams/:examId/schedules
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/exams/$EXAM_ID/schedules" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /exams/:examId/schedules" "200" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 32: Schedule CRUD
# ============================================================
echo "--- Step 32: Schedule CRUD ---"

# Create schedule
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/schedule" \
  -H "Authorization: Bearer $AD_TOK" \
  -H "Content-Type: application/json" \
  -d '{"type":"LECTURE","dayOfWeek":"MONDAY","startTime":"09:00","endTime":"10:00"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
SCHED_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
test_result "POST /schedule - ADMIN" "201" "$HTTP_CODE"

if [ -n "$SCHED_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/schedule/$SCHED_ID" -H "Authorization: Bearer $ST_TOK")
  test_result "GET /schedule/:id" "200" "$HTTP_CODE"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/schedule/$SCHED_ID" \
    -H "Authorization: Bearer $AD_TOK" \
    -H "Content-Type: application/json" \
    -d '{"startTime":"10:00","endTime":"11:00"}')
  test_result "PATCH /schedule/:id - ADMIN" "200" "$HTTP_CODE"

  # Publish schedule
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/schedule/$SCHED_ID/publish" \
    -H "Authorization: Bearer $AD_TOK")
  test_result "POST /schedule/:id/publish" "200" "$HTTP_CODE"

  # Archive schedule
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/schedule/$SCHED_ID/archive" \
    -H "Authorization: Bearer $AD_TOK")
  test_result "POST /schedule/:id/archive" "200" "$HTTP_CODE"

  # Delete schedule
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/schedule/$SCHED_ID" \
    -H "Authorization: Bearer $SA_TOK")
  test_result "DELETE /schedule/:id - SUPER_ADMIN" "200" "$HTTP_CODE"
fi

echo ""

# ============================================================
# STEP 33: Registration - Reject
# ============================================================
echo "--- Step 33: Registration Reject ---"

# Create a student registration to reject
if [ -n "$REG_STUDENT_ID" ] && [ -n "$REG_SEMESTER_ID" ] && [ -n "$COURSE_ID" ]; then
  # Find another course for this test
  COURSE2_RESP=$(curl -s -X POST "$BASE/courses" \
    -H "Authorization: Bearer $AD_TOK" \
    -H "Content-Type: application/json" \
    -d '{"code":"QA103","nameAr":"اختبار 3","nameEn":"QA3","credits":2,"capacity":50}')
  COURSE2_ID=$(echo "$COURSE2_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$COURSE2_ID" ]; then
    REG2_RESP=$(curl -s -X POST "$BASE/registration/register" \
      -H "Authorization: Bearer $ST_TOK" \
      -H "Content-Type: application/json" \
      -d "{\"studentId\":\"$REG_STUDENT_ID\",\"semesterId\":\"$REG_SEMESTER_ID\",\"courseIds\":[\"$COURSE2_ID\"]}")
    REG2_ID=$(echo "$REG2_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$REG2_ID" ]; then
      # Reject registration
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/registration/reject/$REG2_ID" \
        -H "Authorization: Bearer $AV_TOK" \
        -H "Content-Type: application/json" \
        -d '{"reason":"Course prerequisites not met"}')
      test_result "PATCH /registration/reject/:id" "200" "$HTTP_CODE"
    fi
  fi
fi

echo ""

# ============================================================
# STEP 34: Forgot Password
# ============================================================
echo "--- Step 34: Forgot Password ---"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@menouf.edu.eg"}')
test_result "POST /auth/forgot-password - valid email" "200" "$HTTP_CODE"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com"}')
test_result "POST /auth/forgot-password - non-existent email (should still 200)" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 35: Reports - Additional
# ============================================================
echo "--- Step 35: Reports Additional ---"

if [ -n "$REG_SEMESTER_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/reports/registration/$REG_SEMESTER_ID" -H "Authorization: Bearer $AD_TOK")
  test_result "GET /reports/registration/:semesterId" "200" "$HTTP_CODE"
fi

# Reports should require auth
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/reports/registration/active")
test_result "GET /reports/registration/active - no token (should be 401)" "401" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 36: Analytics - Student/Course specific
# ============================================================
echo "--- Step 36: Analytics Specific ---"

if [ -n "$STUDENT_DB_ID" ]; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/analytics/student/$STUDENT_DB_ID" -H "Authorization: Bearer $AD_TOK")
  test_result "GET /analytics/student/:id" "200" "$HTTP_CODE"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/analytics/course/$COURSE_ID" -H "Authorization: Bearer $AD_TOK")
test_result "GET /analytics/course/:id" "200" "$HTTP_CODE"

echo ""

# ============================================================
# STEP 37: Registration - Drop
# ============================================================
echo "--- Step 37: Registration Drop ---"

if [ -n "$REG_STUDENT_ID" ] && [ -n "$REG_SEMESTER_ID" ] && [ -n "$COURSE_ID" ]; then
  # Create a new registration to drop
  REG3_RESP=$(curl -s -X POST "$BASE/courses" \
    -H "Authorization: Bearer $AD_TOK" \
    -H "Content-Type: application/json" \
    -d '{"code":"QA104","nameAr":"اختبار 4","nameEn":"QA4","credits":2,"capacity":50}')
  COURSE3_ID=$(echo "$REG3_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$COURSE3_ID" ]; then
    REG3_REG=$(curl -s -X POST "$BASE/registration/register" \
      -H "Authorization: Bearer $ST_TOK" \
      -H "Content-Type: application/json" \
      -d "{\"studentId\":\"$REG_STUDENT_ID\",\"semesterId\":\"$REG_SEMESTER_ID\",\"courseIds\":[\"$COURSE3_ID\"]}")
    REG3_REG_ID=$(echo "$REG3_REG" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$REG3_REG_ID" ]; then
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/registration/drop/$REG3_REG_ID" \
        -H "Authorization: Bearer $ST_TOK")
      test_result "POST /registration/drop/:id" "200" "$HTTP_CODE"
    fi
  fi
fi

echo ""

# ============================================================
# STEP 38: Attendance - QR & Geolocation
# ============================================================
echo "--- Step 38: Attendance QR & Geolocation ---"

# POST /attendance/qr (STUDENT)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/attendance/qr" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"invalid-qr-code","studentId":"00000000-0000-0000-0000-000000000000"}')
# This may return 400/404 if QR is invalid but shouldn't be 403
QR_STATUS="$HTTP_CODE"
if [ "$QR_STATUS" != "403" ]; then
  PASS=$((PASS+1))
  RESULTS="${RESULTS}\n${GREEN}[PASS]${NC} POST /attendance/qr - STUDENT (not 403, got $QR_STATUS)"
else
  FAIL=$((FAIL+1))
  RESULTS="${RESULTS}\n${RED}[FAIL]${NC} POST /attendance/qr - STUDENT returned 403 (wrong role)"
fi

# POST /attendance/geolocation (STUDENT)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/attendance/geolocation" \
  -H "Authorization: Bearer $ST_TOK" \
  -H "Content-Type: application/json" \
  -d '{"studentId":"00000000-0000-0000-0000-000000000000","courseId":"00000000-0000-0000-0000-000000000000","lectureId":"00000000-0000-0000-0000-000000000000","latitude":30.5,"longitude":31.0}')
# May return 400/404 but shouldn't be 403
GEO_STATUS="$HTTP_CODE"
if [ "$GEO_STATUS" != "403" ]; then
  PASS=$((PASS+1))
  RESULTS="${RESULTS}\n${GREEN}[PASS]${NC} POST /attendance/geolocation - STUDENT (not 403, got $GEO_STATUS)"
else
  FAIL=$((FAIL+1))
  RESULTS="${RESULTS}\n${RED}[FAIL]${NC} POST /attendance/geolocation - STUDENT returned 403 (wrong role)"
fi

echo ""

# ============================================================
# CLEANUP
# ============================================================
echo "--- Cleanup: Deleting test course ---"
# Cleanup test registrations first
# Remove test registrations for courses we created
for CID_VAR in $COURSE_ID; do
  if [ -n "$CID_VAR" ] && [ -n "$REG_STUDENT_ID" ] && [ -n "$REG_SEMESTER_ID" ]; then
    # Find and drop registrations
    REG_LIST=$(curl -s "$BASE/registration/student/$REG_STUDENT_ID" -H "Authorization: Bearer $AV_TOK")
  fi
done

# Delete test course
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/courses/$COURSE_ID" \
  -H "Authorization: Bearer $SA_TOK" 2>/dev/null)

echo ""

# ============================================================
# RESULTS SUMMARY
# ============================================================
TOTAL=$((PASS + FAIL))
echo "============================================"
echo "          TEST RESULTS SUMMARY"
echo "============================================"
echo ""
echo -e "$RESULTS"
echo ""
echo "============================================"
echo "  Total: $TOTAL | ${GREEN}Passed: $PASS${NC} | ${RED}Failed: $FAIL${NC}"
echo "============================================"
