# FEE-MENOUF Smart University Platform — API Documentation

**Base URL:** `http://localhost:4000/api/v1` (development) / `https://api.fee-menouf.local` (production)

**Authentication:** Bearer JWT token in `Authorization` header or httpOnly cookie.

**Content-Type:** `application/json`

**Swagger UI:** `/api/docs`

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

```json
// Request
{
  "email": "student@fee-menouf.edu.eg",
  "password": "SecurePass123!",
  "fullNameAr": "أحمد محمد",
  "fullNameEn": "Ahmed Mohamed",
  "phone": "+201234567890",
  "role": "STUDENT"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "email": "student@fee-menouf.edu.eg",
    "fullNameAr": "أحمد محمد",
    "fullNameEn": "Ahmed Mohamed",
    "role": "STUDENT",
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "message": "User registered successfully"
}
```

### POST /auth/login
Authenticate user and receive tokens.

```json
// Request
{
  "email": "admin@fee-menouf.edu.eg",
  "password": "admin123"
}

// Response 200
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "user": {
      "id": "uuid",
      "email": "admin@fee-menouf.edu.eg",
      "fullNameAr": "مسؤول النظام",
      "fullNameEn": "System Administrator",
      "role": "SUPER_ADMIN"
    }
  },
  "message": "Login successful"
}
```

### POST /auth/refresh
Refresh an expired access token.

```json
// Request
{ "refreshToken": "dGhpcyBpcyBhIHJlZnJl..." }

// Response 200
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "bmV3IHJlZnJl...
  }
}
```

### POST /auth/logout
Invalidate current session.

### GET /auth/profile
Get authenticated user's profile.

### POST /auth/change-password
Change current password.

```json
{ "currentPassword": "oldPass123!", "newPassword": "newPass456!" }
```

### POST /auth/forgot-password
Request password reset email.

```json
{ "email": "user@fee-menouf.edu.eg" }
```

### POST /auth/reset-password
Reset password using token.

```json
{ "token": "reset-token", "newPassword": "newPass456!" }
```

### POST /auth/verify-email
Verify email address.

```json
{ "token": "verification-token" }
```

---

## Users Module

All endpoints require `Authorization: Bearer <token>`.

### GET /users
List users (paginated). Admin/SUPER_ADMIN only.

```
Query: ?page=1&limit=20&role=STUDENT&search=ahmed
```

### GET /users/:id
Get user by ID.

### PATCH /users/:id
Update user details.

```json
{
  "fullNameAr": "أحمد محمد updated",
  "fullNameEn": "Ahmed Mohamed Updated",
  "phone": "+201098765432",
  "isActive": true
}
```

### DELETE /users/:id
Soft-delete user.

### GET /users/:id/activity
Get user activity log.

---

## Courses Module

### GET /courses
List all courses.

```
Query: ?departmentId=uuid&semester=2025-2026&page=1&limit=20
```

### POST /courses
Create a new course.

```json
{
  "code": "EC401",
  "nameAr": "اتصالات رقمية",
  "nameEn": "Digital Communications",
  "credits": 3,
  "lectureHours": 3,
  "labHours": 1,
  "departmentId": "uuid",
  "programId": "uuid",
  "doctorId": "uuid",
  "capacity": 150,
  "description": "Advanced digital communication systems"
}
```

### GET /courses/:id
Get course details with relationships.

### PATCH /courses/:id
Update course.

### DELETE /courses/:id
Delete course.

### POST /courses/:id/enroll
Enroll students in course.

```json
{ "studentIds": ["uuid1", "uuid2"] }
```

### GET /courses/:id/students
List enrolled students.

### GET /courses/:id/materials
List course materials.

---

## Students Module

### GET /students
List students.

```
Query: ?departmentId=uuid&level=3&status=ACTIVE&search=ahmed
```

### POST /students
Create student record.

```json
{
  "userId": "uuid",
  "studentId": "2024001",
  "nationalId": "12345678901234",
  "departmentId": "uuid",
  "programId": "uuid",
  "level": 1,
  "enrollmentDate": "2026-09-01"
}
```

### GET /students/:id
Get student with grades, attendance, warnings.

### PATCH /students/:id
Update student.

### GET /students/:id/transcript
Generate official transcript.

### GET /students/:id/gpa-history
Get GPA history over semesters.

---

## Departments Module

### GET /departments
List departments with faculty info.

### POST /departments
```json
{
  "name": "Electronics & Communication",
  "code": "EC",
  "facultyId": "uuid",
  "description": "Electronic circuits and communication systems"
}
```

### PATCH /departments/:id

### DELETE /departments/:id

---

## Academic Module

### GET /academic/years
List academic years.

### POST /academic/years
```json
{ "year": "2025-2026", "startDate": "2025-09-01", "endDate": "2026-06-30" }
```

### GET /academic/semesters
List semesters for academic year.

### POST /academic/semesters
```json
{
  "academicYearId": "uuid",
  "type": "FIRST_SEMESTER",
  "startDate": "2025-09-15",
  "endDate": "2026-01-30",
  "registrationStartDate": "2025-08-15",
  "registrationEndDate": "2025-09-14"
}
```

---

## Attendance Module

### POST /attendance/record
Record attendance for a lecture.

```json
{
  "lectureId": "uuid",
  "studentIds": ["uuid1", "uuid2"],
  "method": "QR"
}
```

### POST /attendance/scan
Student QR scan attendance.

```json
{
  "lectureId": "uuid",
  "qrToken": "qr-token-value"
}
```

### GET /attendance/lecture/:lectureId
Get attendance for a lecture.

### GET /attendance/student/:studentId/course/:courseId
Get student attendance summary for a course.

### GET /attendance/report
Generate attendance report.

```
Query: ?courseId=uuid&dateFrom=2026-01-01&dateTo=2026-06-30
```

---

## Exams Module

### GET /exams
List exams.

### POST /exams
```json
{
  "courseId": "uuid",
  "semesterId": "uuid",
  "type": "FINAL",
  "date": "2026-06-15",
  "startTime": "09:00",
  "endTime": "12:00",
  "totalMarks": 100
}
```

### GET /exams/:id

### PATCH /exams/:id

### DELETE /exams/:id

### POST /exams/:id/schedule
Create exam schedule entries.

```json
{
  "classroomId": "uuid",
  "invigilatorIds": ["uuid1", "uuid2"],
  "notes": "Bring calculator"
}
```

---

## Grades Module

### POST /grades
Record grades.

```json
{
  "studentId": "uuid",
  "courseId": "uuid",
  "component": "MIDTERM",
  "score": 45,
  "maxScore": 50
}
```

### GET /grades/course/:courseId
Get all grades for a course.

### GET /grades/student/:studentId
Get student's grades.

### PATCH /grades/:id
Update grade (with audit trail).

---

## Schedule Module

### GET /schedule
Get current schedules.

```
Query: ?departmentId=uuid&semesterId=uuid&day=MONDAY
```

### GET /schedule/doctor/:doctorId
Get doctor's schedule.

### GET /schedule/student/:studentId
Get student's schedule.

---

## Scheduling Module (AI-powered)

### POST /scheduling/generate-lectures
Generate lecture schedule using AI constraint solver.

```json
{
  "semesterId": "uuid",
  "strategy": "OPTIMIZED",
  "preferences": {
    "avoidFriday": true,
    "morningLecturesOnly": false,
    "gapBetweenLectures": 30
  }
}
```

### POST /scheduling/generate-exams
Generate exam schedule.

```json
{
  "semesterId": "uuid",
  "examPeriodStart": "2026-06-01",
  "examPeriodEnd": "2026-06-30",
  "preferences": {
    "maxExamsPerDay": 2,
    "gapBetweenExams": 24
  }
}
```

### GET /scheduling/status/:jobId
Get generation job status.

---

## Notifications Module

### POST /notifications/send
Send notification.

```json
{
  "recipientIds": ["uuid1"],
  "type": "ANNOUNCEMENT",
  "title": "Exam Schedule Updated",
  "body": "Final exam schedule has been published.",
  "data": { "examUrl": "/exams/..." }
}
```

### GET /notifications
List user notifications.

### PATCH /notifications/:id/read
Mark notification as read.

### POST /notifications/read-all
Mark all as read.

WebSocket endpoint: `/ws/notifications` — real-time notification push.

---

## Materials Module

### GET /materials/course/:courseId
List course materials.

### POST /materials/upload
Upload course material.

```json
// multipart/form-data
{
  "courseId": "uuid",
  "title": "Week 1 Slides",
  "type": "SLIDES",
  "file": (binary)
}
```

### DELETE /materials/:id

---

## AI Module

### POST /ai/chat
Send message to AI assistant.

```json
{
  "message": "What is my current GPA?",
  "language": "EN",
  "sessionId": "uuid-optional"
}
```

### GET /ai/sessions
Get user's conversation sessions.

### GET /ai/sessions/:sessionId
Get conversation history.

### DELETE /ai/sessions/:sessionId
Delete a session.

### DELETE /ai/clear
Clear all conversations.

---

## WebSocket Events

### Connection
```
wss://api.fee-menouf.local/ws/notifications?token=<jwt_token>
```

### Events
| Event           | Direction | Description                        |
|-----------------|-----------|------------------------------------|
| notification    | Server→Client | New notification received      |
| attendance_update | Server→Client | Attendance recorded          |
| grade_published | Server→Client | New grade published           |
| schedule_update | Server→Client | Schedule changed              |
| typing          | Client→Server | User is typing (AI chat)     |
| message         | Bidirectional | AI chat message               |

---

## Error Codes

| Status | Code                  | Description                            |
|--------|-----------------------|----------------------------------------|
| 400    | VALIDATION_ERROR      | Request body validation failed         |
| 400    | INVALID_INPUT         | Invalid input parameters               |
| 401    | UNAUTHORIZED          | Missing or invalid authentication      |
| 401    | TOKEN_EXPIRED         | JWT token has expired                  |
| 401    | INVALID_CREDENTIALS   | Wrong email or password                |
| 403    | FORBIDDEN             | Insufficient permissions (RBAC)        |
| 404    | NOT_FOUND             | Resource not found                     |
| 409    | DUPLICATE_RESOURCE    | Resource already exists                |
| 409    | CONFLICT              | State conflict                         |
| 422    | UNPROCESSABLE_ENTITY  | Business rule violation                |
| 429    | RATE_LIMIT_EXCEEDED   | Too many requests                      |
| 500    | INTERNAL_ERROR        | Server error                           |
| 503    | SERVICE_UNAVAILABLE   | Service temporarily unavailable        |

---

## Rate Limiting

| Endpoint Group   | Limit          | Window |
|------------------|----------------|--------|
| Auth endpoints   | 5 requests     | 15 min |
| General API      | 100 requests   | 1 min  |
| AI endpoints     | 10 requests    | 1 min  |
| File uploads     | 10 requests    | 1 min  |
| Login attempts   | 5 attempts     | 15 min |

Rate limit headers included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
