# FEE-MENOUF Smart University Platform — Database Documentation

## Overview

**Database:** PostgreSQL 16 with pgvector extension  
**Schema:** `app` (application data), `audit` (audit logs)  
**ORM:** TypeORM with code-first entity definitions  
**Migrations:** TypeORM migrations (generated from entity changes)  

## Entity Relationship Diagram (Textual)

```
users ──1:1──► students ──M:1──► departments ──M:1──► faculties
  │               │                                      │
  │               │ M:N (via course_registrations)       │
  │               ├──► courses ◄──M:N── prerequisites    │
  │               │                                      │
  │               ├──► grades                            │
  │               ├──► attendance ◄──M:1── lectures      │
  │               ├──► warnings                          │
  │               └──► gpa_history                       │
  │                                                        │
  ├──1:1──► doctors ──M:1──► departments                  │
  │             │                                          │
  │             └──M:N──► courses (taught by)              │
  │                                                        │
  ├──1:1──► ta ──M:N──► courses (assists)                 │
  ├──1:1──► advisor                                       │
  ├──► notifications                                      │
  ├──► ai_conversations                                   │
  └──► audit_logs                                         │
                                                            │
courses ──M:1──► programs ──M:1──► departments             │
  │                                                         │
  ├──► lectures ──M:1──► classrooms                        │
  ├──► exams ──M:1──► exam_schedules ──M:1──► classrooms   │
  ├──► course_materials                                    │
  ├──► announcements                                       │
  └──► attendance                                          │
                                                            │
semesters ──M:1──► academic_years                           │
  ├──► exams                                                │
  └──► schedules                                            │
```

## Tables

### users
Core user account table. Supports all roles via single table with role discriminator.

| Column          | Type                  | Constraints              | Description                    |
|-----------------|-----------------------|--------------------------|--------------------------------|
| id              | UUID                  | PK, DEFAULT gen_random_uuid() | Primary identifier         |
| email           | VARCHAR(255)          | UNIQUE, NOT NULL, INDEX   | Login email                    |
| password        | VARCHAR(255)          | NOT NULL                  | bcrypt hashed password         |
| full_name_ar    | VARCHAR(255)          | NOT NULL                  | Arabic full name               |
| full_name_en    | VARCHAR(255)          | NOT NULL                  | English full name              |
| role            | ENUM (UserRole)       | NOT NULL, DEFAULT 'STUDENT' | User role                   |
| phone           | VARCHAR(20)           | NULLABLE                  | Contact number                 |
| avatar          | VARCHAR(500)          | NULLABLE                  | Avatar URL                     |
| is_active       | BOOLEAN               | DEFAULT true              | Account active flag            |
| is_verified     | BOOLEAN               | DEFAULT false             | Email verification status      |
| last_login      | TIMESTAMP             | NULLABLE                  | Last login timestamp           |
| refresh_token   | VARCHAR(500)          | NULLABLE                  | Current refresh token (hashed) |
| created_at      | TIMESTAMP             | DEFAULT NOW()             | Creation timestamp             |
| updated_at      | TIMESTAMP             | DEFAULT NOW()             | Last update timestamp          |

**Indexes:** `users_email_idx` (UNIQUE), `users_role_idx`  
**Relationships:** One-to-One with `students`, `doctors`, `ta`, `advisor`  
**Audit:** All password changes logged in `audit_logs`

### students
Extended profile for users with role = STUDENT.

| Column              | Type                  | Constraints         | Description                  |
|---------------------|-----------------------|---------------------|------------------------------|
| id                  | UUID                  | PK                  | Primary identifier            |
| user_id             | UUID                  | UNIQUE, FK→users    | Reference to user account    |
| student_id          | VARCHAR(50)           | UNIQUE, INDEX       | University-assigned ID       |
| national_id         | VARCHAR(20)           | NULLABLE            | National ID number           |
| level               | INT                   | DEFAULT 1           | Academic year (1-5)          |
| enrollment_date     | DATE                  | NULLABLE            | Date of enrollment           |
| graduation_date     | DATE                  | NULLABLE            | Expected/actual graduation   |
| status              | ENUM(StudentStatus)   | DEFAULT 'ACTIVE'    | Active/Graduated/Suspended   |
| total_credits       | INT                   | DEFAULT 0           | Accumulated credits          |
| gpa                 | DECIMAL(4,2)          | DEFAULT 0.00        | Semester GPA                 |
| cgpa                | DECIMAL(4,2)          | DEFAULT 0.00        | Cumulative GPA               |
| academic_warnings   | INT                   | DEFAULT 0           | Number of academic warnings  |
| department_id       | UUID                  | FK→departments      | Student's department         |
| program_id          | UUID                  | FK→programs         | Enrolled program             |
| academic_year_id    | UUID                  | FK→academic_years   | Current academic year        |
| semester_id         | UUID                  | FK→semesters        | Current semester             |

**Indexes:** `students_student_id_idx` (UNIQUE), `students_department_id_idx`, `students_user_id_idx` (UNIQUE)

### doctors
Extended profile for teaching staff.

| Column          | Type                  | Constraints         | Description                  |
|-----------------|-----------------------|---------------------|------------------------------|
| id              | UUID                  | PK                  | Primary identifier            |
| user_id         | UUID                  | UNIQUE, FK→users    | Reference to user account    |
| doctor_id       | VARCHAR(50)           | UNIQUE              | Staff ID                     |
| title           | ENUM(DoctorTitle)     | NOT NULL            | PROFESSOR/ASSISTANT/...      |
| department_id   | UUID                  | FK→departments      | Home department              |
| specialization  | VARCHAR(255)          | NULLABLE            | Academic specialization      |
| office_location | VARCHAR(255)          | NULLABLE            | Office/room number           |
| office_hours    | JSONB                 | NULLABLE            | Office hours schedule        |

### departments
Academic departments within faculties.

| Column      | Type                  | Constraints         | Description                  |
|-------------|-----------------------|---------------------|------------------------------|
| id          | UUID                  | PK                  | Primary identifier            |
| name        | VARCHAR(255)          | NOT NULL            | Department name              |
| code        | VARCHAR(50)           | UNIQUE              | Department code (EC, CSE)    |
| description | TEXT                  | NULLABLE            | Department description       |
| faculty_id  | UUID                  | FK→faculties        | Parent faculty               |
| head_id     | UUID                  | FK→doctors          | Department head              |
| created_at  | TIMESTAMP             | DEFAULT NOW()       |                              |

### faculties
University faculties.

| Column      | Type                  | Constraints         | Description                  |
|-------------|-----------------------|---------------------|------------------------------|
| id          | UUID                  | PK                  | Primary identifier            |
| name        | VARCHAR(255)          | NOT NULL            | Faculty name                 |
| slug        | VARCHAR(255)          | UNIQUE              | URL-friendly identifier      |
| code        | VARCHAR(20)           | UNIQUE              | Faculty code                 |
| description | TEXT                  | NULLABLE            |                              |
| dean_id     | UUID                  | FK→doctors          | Faculty dean                 |

### programs
Academic programs (curricula) offered by departments.

| Column        | Type                  | Constraints         | Description                  |
|---------------|-----------------------|---------------------|------------------------------|
| id            | UUID                  | PK                  |                              |
| name          | VARCHAR(255)          | NOT NULL            | Program name                 |
| code          | VARCHAR(50)           | UNIQUE              | Program code                 |
| degree        | ENUM(Degree)          | NOT NULL            | BACHELOR/MASTER/PHD          |
| duration_years| INT                   | DEFAULT 4           | Program length               |
| total_credits | INT                   | DEFAULT 0           | Required credits             |
| department_id | UUID                  | FK→departments      | Owning department            |

### courses
Academic courses offered.

| Column           | Type                  | Constraints         | Description                  |
|------------------|-----------------------|---------------------|------------------------------|
| id               | UUID                  | PK                  |                              |
| code             | VARCHAR(50)           | UNIQUE, INDEX       | Course code (EC401)          |
| name_ar          | VARCHAR(255)          | NOT NULL            | Arabic name                  |
| name_en          | VARCHAR(255)          | NOT NULL            | English name                 |
| credits          | INT                   | NOT NULL            | Credit hours                 |
| lecture_hours    | INT                   | DEFAULT 0           | Weekly lecture hours         |
| lab_hours        | INT                   | DEFAULT 0           | Weekly lab hours             |
| semester_offered | VARCHAR(255)          | NULLABLE            | Which semesters              |
| description      | TEXT                  | NULLABLE            | Course description           |
| capacity         | INT                   | DEFAULT 100         | Max students                 |
| max_students     | INT                   | DEFAULT 0           | Enrollment cap               |
| is_active        | BOOLEAN               | DEFAULT true        | Course is currently offered  |
| department_id    | UUID                  | FK→departments      | Owning department            |
| program_id       | UUID                  | FK→programs         | Program affiliation          |
| doctor_id        | UUID                  | FK→doctors          | Primary instructor           |

**Relationships:** M:N self-referencing for prerequisites via `course_prerequisites` join table

### lectures
Individual lecture sessions within a course.

| Column      | Type                  | Constraints         | Description                  |
|-------------|-----------------------|---------------------|------------------------------|
| id          | UUID                  | PK                  |                              |
| course_id   | UUID                  | FK→courses, INDEX   | Parent course                |
| title       | VARCHAR(255)          | NOT NULL            | Lecture title                |
| type        | ENUM(LectureType)     | DEFAULT 'LECTURE'   | LECTURE/LAB/TUTORIAL         |
| day         | VARCHAR(20)           | NOT NULL            | MONDAY/TUESDAY/...           |
| start_time  | TIME                  | NOT NULL            | Start time                   |
| end_time    | TIME                  | NOT NULL            | End time                     |
| room_id     | UUID                  | FK→classrooms       | Assigned classroom           |
| week_number | INT                   | NULLABLE            | Week in semester             |
| is_cancelled| BOOLEAN               | DEFAULT false       | Cancelled flag               |

### classrooms
Physical rooms and lecture halls.

| Column       | Type                  | Constraints         | Description                  |
|--------------|-----------------------|---------------------|------------------------------|
| id           | UUID                  | PK                  |                              |
| name         | VARCHAR(100)          | NOT NULL            | Room name/number             |
| type         | ENUM(ClassroomType)   | NOT NULL            | LECTURE_HALL/LAB/OFFICE      |
| capacity     | INT                   | NOT NULL            | Seating capacity             |
| building     | VARCHAR(255)          | NULLABLE            | Building name                |
| floor        | INT                   | NULLABLE            | Floor number                 |
| equipment    | JSONB                 | NULLABLE            | Available equipment          |

### exams
Exam definitions.

| Column       | Type                  | Constraints         | Description                  |
|--------------|-----------------------|---------------------|------------------------------|
| id           | UUID                  | PK                  |                              |
| course_id    | UUID                  | FK→courses, INDEX   | Course being examined        |
| semester_id  | UUID                  | FK→semesters, INDEX | Exam semester                |
| type         | ENUM(ExamType)        | NOT NULL            | MIDTERM/FINAL/QUIZ/PRACTICAL |
| date         | DATE                  | NOT NULL            | Exam date                    |
| start_time   | TIME                  | NOT NULL            | Start time                   |
| end_time     | TIME                  | NOT NULL            | End time                     |
| duration     | INT                   | NOT NULL            | Duration in minutes          |
| total_marks  | DECIMAL(5,2)          | NOT NULL            | Maximum score                |

### exam_schedules
Exam room assignments and invigilators.

| Column         | Type                  | Constraints         | Description                  |
|----------------|-----------------------|---------------------|------------------------------|
| id             | UUID                  | PK                  |                              |
| exam_id        | UUID                  | FK→exams            | Related exam                 |
| classroom_id   | UUID                  | FK→classrooms       | Assigned room                |
| invigilator_ids| UUID[]                | FK→doctors[]        | Assigned invigilators        |
| student_group  | VARCHAR(100)          | NULLABLE            | Group identifier             |
| notes          | TEXT                  | NULLABLE            | Special instructions         |

### grades
Individual grade entries per student per course component.

| Column      | Type                  | Constraints         | Description                  |
|-------------|-----------------------|---------------------|------------------------------|
| id          | UUID                  | PK                  |                              |
| student_id  | UUID                  | FK→students, INDEX  | Graded student               |
| course_id   | UUID                  | FK→courses, INDEX   | Course                       |
| component   | ENUM(GradeComponent)  | NOT NULL            | MIDTERM/FINAL/QUIZ/LAB/PROJECT|
| score       | DECIMAL(5,2)          | NOT NULL            | Obtained score               |
| max_score   | DECIMAL(5,2)          | NOT NULL            | Maximum possible              |
| percentage  | DECIMAL(5,2)          | GENERATED           | score/max_score * 100        |
| graded_by   | UUID                  | FK→users            | Who entered the grade        |
| graded_at   | TIMESTAMP             | DEFAULT NOW()       | When graded                  |

### attendance
Attendance records per student per lecture.

| Column        | Type                  | Constraints         | Description                  |
|---------------|-----------------------|---------------------|------------------------------|
| id            | UUID                  | PK                  |                              |
| student_id    | UUID                  | FK→students, INDEX  | Student                      |
| lecture_id    | UUID                  | FK→lectures, INDEX  | Lecture session              |
| course_id     | UUID                  | FK→courses          | Course (denormalized)        |
| status        | ENUM(AttendanceStatus)| NOT NULL            | PRESENT/ABSENT/LATE/EXCUSED  |
| method        | ENUM(AttendanceMethod)| NOT NULL            | QR/MANUAL/FACE               |
| scanned_at    | TIMESTAMP             | DEFAULT NOW()       | Time of scan/entry           |
| scanned_by    | UUID                  | FK→users            | Who recorded                 |
| qr_token      | VARCHAR(255)          | NULLABLE            | QR token used                |

### academic_years
Academic year definitions.

| Column     | Type                  | Constraints         | Description                  |
|------------|-----------------------|---------------------|------------------------------|
| id         | UUID                  | PK                  |                              |
| year       | VARCHAR(20)           | UNIQUE, NOT NULL    | "2025-2026"                  |
| start_date | DATE                  | NOT NULL            | Year start                   |
| end_date   | DATE                  | NOT NULL            | Year end                     |
| is_current | BOOLEAN               | DEFAULT false       | Currently active             |

### semesters
Semester definitions within academic years.

| Column                  | Type               | Constraints         | Description                  |
|-------------------------|--------------------|---------------------|------------------------------|
| id                      | UUID               | PK                  |                              |
| academic_year_id        | UUID               | FK→academic_years   | Parent year                  |
| type                    | ENUM(SemesterType) | NOT NULL            | FIRST_SEMESTER/SECOND/SUMMER |
| start_date              | DATE               | NOT NULL            | Semester start               |
| end_date                | DATE               | NOT NULL            | Semester end                 |
| registration_start_date | DATE               | NULLABLE            | Enrollment window start      |
| registration_end_date   | DATE               | NULLABLE            | Enrollment window end        |
| is_current              | BOOLEAN            | DEFAULT false       | Currently active             |

### notifications
User notifications.

| Column        | Type                  | Constraints         | Description                  |
|---------------|-----------------------|---------------------|------------------------------|
| id            | UUID                  | PK                  |                              |
| user_id       | UUID                  | FK→users, INDEX     | Recipient                    |
| type          | ENUM(NotificationType)| NOT NULL            | ANNOUNCEMENT/GRADE/ATTENDANCE|
| title         | VARCHAR(255)          | NOT NULL            | Notification title           |
| body          | TEXT                  | NOT NULL            | Notification body            |
| data          | JSONB                 | NULLABLE            | Additional payload           |
| is_read       | BOOLEAN               | DEFAULT false       | Read status                  |
| read_at       | TIMESTAMP             | NULLABLE            | When read                    |
| created_at    | TIMESTAMP             | DEFAULT NOW()       |                              |

### ai_conversations
AI assistant conversation history.

| Column      | Type                         | Constraints         | Description                  |
|-------------|------------------------------|---------------------|------------------------------|
| id          | UUID                         | PK                  |                              |
| user_id     | UUID                         | FK→users, INDEX     | User                         |
| session_id  | VARCHAR(255)                 | NOT NULL            | Session grouping identifier  |
| role        | ENUM(ConversationRole)       | NOT NULL            | USER/ASSISTANT/SYSTEM        |
| content     | TEXT                         | NOT NULL            | Message content              |
| language    | ENUM(ConversationLanguage)   | DEFAULT 'EN'        | AR/EN                        |
| metadata    | JSONB                        | NULLABLE            | Tokens, model, latency       |
| created_at  | TIMESTAMP                    | DEFAULT NOW()       |                              |

### audit_logs
Comprehensive audit trail for sensitive operations.

| Column       | Type                  | Constraints         | Description                  |
|--------------|-----------------------|---------------------|------------------------------|
| id           | UUID                  | PK                  |                              |
| user_id      | UUID                  | FK→users, INDEX     | Who performed action         |
| action       | VARCHAR(100)          | NOT NULL            | Action type                  |
| entity       | VARCHAR(100)          | NOT NULL            | Affected entity              |
| entity_id    | UUID                  | NULLABLE            | Entity identifier            |
| old_values   | JSONB                 | NULLABLE            | Previous state               |
| new_values   | JSONB                 | NULLABLE            | New state                    |
| ip_address   | VARCHAR(45)           | NULLABLE            | Source IP                    |
| user_agent   | TEXT                  | NULLABLE            | Client user agent            |
| created_at   | TIMESTAMP             | DEFAULT NOW()       |                              |

### Additional Tables
- **course_registrations** — M:N join: students enrolled in courses with status/grade
- **course_materials** — Files linked to courses (slides, assignments, references)
- **announcements** — Course-specific announcements
- **warnings** — Academic warnings for students
- **gpa_history** — GPA snapshots per semester
- **schedules** — Generated schedule entries (lecture/exam assignments)
- **lecture_schedules** — Detailed schedule for individual lectures
- **advisors** — Faculty advisors for students
- **ta** — Teaching assistants with assigned courses

## Migration Strategy

```bash
# Generate migration from entity changes
npm run typeorm migration:generate -- -n MigrationName

# Run pending migrations
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert
```

Migrations are auto-run on application startup in development. In production, they run as part of the deployment pipeline.

## Seed Data

See `scripts/seed.sh` for comprehensive seed data including:
- 12 roles (super-admin, admin, dean, head-of-department, professor, etc.)
- 30+ permissions organized by functional groups
- Role-permission mappings
- 5 faculties with 14 departments
- Default admin user (admin@fee-menouf.edu.eg / admin123)
- 18 system configuration entries

## Performance Considerations

- **Indexes** on all foreign keys and frequently queried columns
- **Composite indexes** on (department_id, semester_id) for schedule queries
- **Partial indexes** on `is_current` for academic_years and semesters
- **Covering indexes** for grade report queries
- **pgvector index** (IVFFlat) on embedding columns for RAG
- **Connection pooling** via TypeORM with configurable pool size (2-10)
- **Query logging** in development; slow query log (>100ms) in production
- **Regular VACUUM ANALYZE** scheduled via cron/pg_cron
