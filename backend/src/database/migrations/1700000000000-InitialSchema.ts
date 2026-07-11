import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('STUDENT', 'DOCTOR', 'TA', 'ADVISOR', 'HEAD', 'ADMIN', 'SUPER_ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."students_status_enum" AS ENUM('ACTIVE', 'GRADUATED', 'SUSPENDED', 'WITHDRAWN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."doctors_title_enum" AS ENUM('PROFESSOR', 'ASSOCIATE', 'ASSISTANT', 'LECTURER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."departments_faculty_enum" AS ENUM('FE_ELECTRONIC_ENGINEERING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."programs_degree_enum" AS ENUM('BACHELOR', 'MASTER', 'PHD')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."semesters_type_enum" AS ENUM('FALL', 'SPRING', 'SUMMER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."course_registrations_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'DROPPED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."attendance_method_enum" AS ENUM('QR', 'GEOLOCATION', 'MANUAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lectures_type_enum" AS ENUM('LECTURE', 'LAB', 'TUTORIAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."grades_component_enum" AS ENUM('MIDTERM', 'FINAL', 'COURSEWORK', 'LAB', 'TOTAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exams_type_enum" AS ENUM('MIDTERM', 'FINAL', 'QUIZ', 'PRACTICAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."classrooms_type_enum" AS ENUM('LECTURE_HALL', 'LAB', 'SEMINAR_ROOM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('REGISTRATION', 'GRADE', 'ATTENDANCE', 'EXAM', 'DEADLINE', 'WARNING', 'GENERAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_conversations_role_enum" AS ENUM('USER', 'ASSISTANT', 'SYSTEM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_conversations_language_enum" AS ENUM('AR', 'EN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."schedules_type_enum" AS ENUM('LECTURE', 'EXAM')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."schedules_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."course_materials_type_enum" AS ENUM('PDF', 'VIDEO', 'DOC', 'LINK', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."announcements_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."warnings_type_enum" AS ENUM('ACADEMIC', 'ATTENDANCE', 'BEHAVIORAL', 'FINANCIAL')`,
    );

    await queryRunner.query(
      `CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "password" character varying(255) NOT NULL,
        "full_name_ar" character varying(255) NOT NULL,
        "full_name_en" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'STUDENT',
        "phone" character varying(20),
        "avatar" character varying(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "is_verified" boolean NOT NULL DEFAULT false,
        "last_login" TIMESTAMP,
        "refresh_token" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_role" ON "users" ("role")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_is_active" ON "users" ("is_active")`,
    );

    await queryRunner.query(
      `CREATE TABLE "departments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name_ar" character varying(255) NOT NULL,
        "name_en" character varying(255) NOT NULL,
        "code" character varying(50) NOT NULL,
        "faculty" "public"."departments_faculty_enum" NOT NULL DEFAULT 'FE_ELECTRONIC_ENGINEERING',
        "head_id" character varying(255),
        "description" text,
        "contact_email" character varying(255),
        "contact_phone" character varying(50),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_departments_code" UNIQUE ("code")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_departments_code" ON "departments" ("code")`,
    );

    await queryRunner.query(
      `CREATE TABLE "programs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name_ar" character varying(255) NOT NULL,
        "name_en" character varying(255) NOT NULL,
        "code" character varying(50) NOT NULL,
        "duration" integer NOT NULL DEFAULT 4,
        "total_credits" integer NOT NULL DEFAULT 160,
        "degree" "public"."programs_degree_enum" NOT NULL DEFAULT 'BACHELOR',
        "department_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_programs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_programs_code" UNIQUE ("code")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_programs_code" ON "programs" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_programs_department_id" ON "programs" ("department_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "academic_years" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "year" character varying(20) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "is_active" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academic_years" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_academic_years_year" UNIQUE ("year")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_academic_years_year" ON "academic_years" ("year")`,
    );

    await queryRunner.query(
      `CREATE TABLE "semesters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name_ar" character varying(255) NOT NULL,
        "name_en" character varying(255) NOT NULL,
        "type" "public"."semesters_type_enum" NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "registration_start" date,
        "registration_end" date,
        "is_active" boolean NOT NULL DEFAULT true,
        "academic_year_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_semesters" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_semesters_academic_year_id" ON "semesters" ("academic_year_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "doctors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employee_id" character varying(50) NOT NULL,
        "title" "public"."doctors_title_enum" NOT NULL DEFAULT 'LECTURER',
        "specialization" character varying(255),
        "office_location" character varying(255),
        "office_hours" text,
        "user_id" uuid NOT NULL,
        "department_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctors" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_doctors_employee_id" UNIQUE ("employee_id"),
        CONSTRAINT "REL_doctors_user_id" UNIQUE ("user_id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_doctors_employee_id" ON "doctors" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_doctors_user_id" ON "doctors" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_doctors_department_id" ON "doctors" ("department_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "tas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employee_id" character varying(50) NOT NULL,
        "user_id" uuid NOT NULL,
        "department_id" uuid,
        "supervisor_doctor_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tas" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tas_employee_id" UNIQUE ("employee_id"),
        CONSTRAINT "REL_tas_user_id" UNIQUE ("user_id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tas_employee_id" ON "tas" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tas_user_id" ON "tas" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tas_department_id" ON "tas" ("department_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tas_supervisor_doctor_id" ON "tas" ("supervisor_doctor_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "advisors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "employee_id" character varying(50) NOT NULL,
        "office_hours" text,
        "max_students" integer NOT NULL DEFAULT 0,
        "user_id" uuid NOT NULL,
        "department_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_advisors" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_advisors_employee_id" UNIQUE ("employee_id"),
        CONSTRAINT "REL_advisors_user_id" UNIQUE ("user_id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_advisors_employee_id" ON "advisors" ("employee_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_advisors_user_id" ON "advisors" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_advisors_department_id" ON "advisors" ("department_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "students" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "student_id" character varying(50) NOT NULL,
        "national_id" character varying(20),
        "level" integer NOT NULL DEFAULT 1,
        "enrollment_date" date,
        "graduation_date" date,
        "status" "public"."students_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "total_credits" integer NOT NULL DEFAULT 0,
        "gpa" numeric(4,2) NOT NULL DEFAULT 0.00,
        "cgpa" numeric(4,2) NOT NULL DEFAULT 0.00,
        "academic_warnings" integer NOT NULL DEFAULT 0,
        "user_id" uuid NOT NULL,
        "department_id" uuid,
        "program_id" uuid,
        "academic_year_id" uuid,
        "semester_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_students" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_students_student_id" UNIQUE ("student_id"),
        CONSTRAINT "REL_students_user_id" UNIQUE ("user_id")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_students_student_id" ON "students" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_user_id" ON "students" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_department_id" ON "students" ("department_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_program_id" ON "students" ("program_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_students_status" ON "students" ("status")`,
    );

    await queryRunner.query(
      `CREATE TABLE "courses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(50) NOT NULL,
        "name_ar" character varying(255) NOT NULL,
        "name_en" character varying(255) NOT NULL,
        "credits" integer NOT NULL,
        "lecture_hours" integer NOT NULL DEFAULT 0,
        "lab_hours" integer NOT NULL DEFAULT 0,
        "semester_offered" character varying(255),
        "description" text,
        "capacity" integer NOT NULL DEFAULT 100,
        "max_students" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "department_id" uuid,
        "program_id" uuid,
        "doctor_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courses" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_courses_code" UNIQUE ("code")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_courses_code" ON "courses" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_courses_department_id" ON "courses" ("department_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_courses_program_id" ON "courses" ("program_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_courses_doctor_id" ON "courses" ("doctor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_courses_is_active" ON "courses" ("is_active")`,
    );

    await queryRunner.query(
      `CREATE TABLE "course_prerequisites" (
        "course_id" uuid NOT NULL,
        "prerequisite_id" uuid NOT NULL,
        CONSTRAINT "PK_course_prerequisites" PRIMARY KEY ("course_id", "prerequisite_id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "course_registrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" "public"."course_registrations_status_enum" NOT NULL DEFAULT 'PENDING',
        "registered_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "approved_at" TIMESTAMP,
        "grade" character varying(10),
        "credits" integer NOT NULL DEFAULT 0,
        "created_by" character varying(255),
        "student_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "semester_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_registrations" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_registrations_student_id" ON "course_registrations" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_registrations_course_id" ON "course_registrations" ("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_registrations_semester_id" ON "course_registrations" ("semester_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_registrations_status" ON "course_registrations" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_registrations_student_semester" ON "course_registrations" ("student_id", "semester_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "lectures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "day_of_week" integer NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "type" "public"."lectures_type_enum" NOT NULL DEFAULT 'LECTURE',
        "group" character varying(50),
        "week_pattern" character varying(255),
        "room" character varying(100),
        "title" character varying(255),
        "qr_code" text,
        "qr_expires_at" TIMESTAMP,
        "course_id" uuid NOT NULL,
        "doctor_id" uuid,
        "classroom_id" uuid,
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "geolocation_radius" integer DEFAULT 50,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lectures" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lectures_course_id" ON "lectures" ("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lectures_doctor_id" ON "lectures" ("doctor_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "attendance" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" date NOT NULL,
        "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'PRESENT',
        "method" "public"."attendance_method_enum" NOT NULL DEFAULT 'MANUAL',
        "geolocation" jsonb,
        "student_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "lecture_id" uuid,
        "marked_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_student_id" ON "attendance" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_course_id" ON "attendance" ("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_lecture_id" ON "attendance" ("lecture_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_date" ON "attendance" ("date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_marked_by" ON "attendance" ("marked_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_student_lecture" ON "attendance" ("student_id", "lecture_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "grades" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "component" "public"."grades_component_enum" NOT NULL,
        "score" numeric(5,2) NOT NULL,
        "max_score" numeric(5,2) NOT NULL,
        "weight" numeric(5,2) NOT NULL DEFAULT 1.00,
        "is_published" boolean NOT NULL DEFAULT false,
        "remarks" text,
        "graded_at" TIMESTAMP,
        "student_id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "semester_id" uuid NOT NULL,
        "graded_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_grades" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_student_id" ON "grades" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_course_id" ON "grades" ("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_semester_id" ON "grades" ("semester_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_graded_by" ON "grades" ("graded_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_grades_student_course_semester" ON "grades" ("student_id", "course_id", "semester_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "gpa_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "semester_gpa" numeric(4,2) NOT NULL,
        "cgpa" numeric(4,2) NOT NULL,
        "total_credits" integer NOT NULL DEFAULT 0,
        "earned_credits" integer NOT NULL DEFAULT 0,
        "student_id" uuid NOT NULL,
        "semester_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gpa_history" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gpa_history_student_id" ON "gpa_history" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_gpa_history_semester_id" ON "gpa_history" ("semester_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "exams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."exams_type_enum" NOT NULL,
        "date" date NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "duration" integer NOT NULL,
        "total_marks" numeric(5,2) NOT NULL,
        "course_id" uuid NOT NULL,
        "semester_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exams" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exams_course_id" ON "exams" ("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exams_semester_id" ON "exams" ("semester_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "classrooms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "code" character varying(50) NOT NULL,
        "type" "public"."classrooms_type_enum" NOT NULL DEFAULT 'LECTURE_HALL',
        "capacity" integer NOT NULL,
        "building" character varying(255),
        "floor" integer NOT NULL DEFAULT 0,
        "has_projector" boolean NOT NULL DEFAULT false,
        "has_computers" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_classrooms" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_classrooms_code" UNIQUE ("code")
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_classrooms_code" ON "classrooms" ("code")`,
    );

    await queryRunner.query(
      `CREATE TABLE "exam_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" date NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "section" character varying(50),
        "group" character varying(50),
        "exam_id" uuid NOT NULL,
        "classroom_id" uuid,
        "invigilator_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_schedules" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_schedules_exam_id" ON "exam_schedules" ("exam_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_schedules_classroom_id" ON "exam_schedules" ("classroom_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exam_schedules_invigilator_id" ON "exam_schedules" ("invigilator_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'GENERAL',
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_is_read" ON "notifications" ("user_id", "is_read")`,
    );

    await queryRunner.query(
      `CREATE TABLE "ai_conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "session_id" character varying(255) NOT NULL,
        "role" "public"."ai_conversations_role_enum" NOT NULL,
        "content" text NOT NULL,
        "language" "public"."ai_conversations_language_enum" NOT NULL DEFAULT 'EN',
        "metadata" jsonb,
        "tokens_used" integer NOT NULL DEFAULT 0,
        "user_id" uuid NOT NULL,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_conversations" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ai_conversations_user_id" ON "ai_conversations" ("user_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."schedules_type_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "data" jsonb NOT NULL,
        "status" "public"."schedules_status_enum" NOT NULL DEFAULT 'DRAFT',
        "semester_id" uuid,
        "department_id" uuid,
        "generation_duration" integer,
        "fitness_score" numeric(5,2),
        "constraints" jsonb,
        "optimization_metrics" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_schedules" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" character varying(255) NOT NULL,
        "entity" character varying(255) NOT NULL,
        "entity_id" character varying(255),
        "old_values" jsonb,
        "new_values" jsonb,
        "ip_address" character varying(50),
        "user_agent" text,
        "user_id" uuid,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_action" ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_timestamp" ON "audit_logs" ("timestamp")`,
    );

    await queryRunner.query(
      `CREATE TABLE "course_materials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "description" text,
        "type" "public"."course_materials_type_enum" NOT NULL DEFAULT 'PDF',
        "url" character varying(500) NOT NULL,
        "is_published" boolean NOT NULL DEFAULT true,
        "course_id" uuid NOT NULL,
        "uploaded_by" uuid,
        "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_materials" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_materials_course_id" ON "course_materials" ("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_materials_uploaded_by" ON "course_materials" ("uploaded_by")`,
    );

    await queryRunner.query(
      `CREATE TABLE "announcements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "priority" "public"."announcements_priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "expires_at" TIMESTAMP,
        "course_id" uuid NOT NULL,
        "doctor_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_announcements_course_id" ON "announcements" ("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_announcements_doctor_id" ON "announcements" ("doctor_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "warnings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "public"."warnings_type_enum" NOT NULL DEFAULT 'ACADEMIC',
        "reason" text NOT NULL,
        "action" text,
        "is_resolved" boolean NOT NULL DEFAULT false,
        "resolved_at" TIMESTAMP,
        "student_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_warnings" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_warnings_student_id" ON "warnings" ("student_id")`,
    );

    await queryRunner.query(
      `CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource" character varying(100) NOT NULL,
        "action" character varying(50) NOT NULL,
        "description" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "programs" ADD CONSTRAINT "FK_programs_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "semesters" ADD CONSTRAINT "FK_semesters_academic_year_id" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD CONSTRAINT "FK_doctors_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD CONSTRAINT "FK_doctors_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tas" ADD CONSTRAINT "FK_tas_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tas" ADD CONSTRAINT "FK_tas_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tas" ADD CONSTRAINT "FK_tas_supervisor_doctor_id" FOREIGN KEY ("supervisor_doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "advisors" ADD CONSTRAINT "FK_advisors_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "advisors" ADD CONSTRAINT "FK_advisors_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_students_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_students_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_students_program_id" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_students_academic_year_id" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_students_semester_id" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_department_id" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_program_id" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_courses_doctor_id" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD CONSTRAINT "FK_course_prerequisites_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD CONSTRAINT "FK_course_prerequisites_prerequisite_id" FOREIGN KEY ("prerequisite_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_registrations" ADD CONSTRAINT "FK_course_registrations_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_registrations" ADD CONSTRAINT "FK_course_registrations_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_registrations" ADD CONSTRAINT "FK_course_registrations_semester_id" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lectures" ADD CONSTRAINT "FK_lectures_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lectures" ADD CONSTRAINT "FK_lectures_doctor_id" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_lecture_id" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_attendance_marked_by" FOREIGN KEY ("marked_by") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_semester_id" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_grades_graded_by" FOREIGN KEY ("graded_by") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gpa_history" ADD CONSTRAINT "FK_gpa_history_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gpa_history" ADD CONSTRAINT "FK_gpa_history_semester_id" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_exams_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_exams_semester_id" FOREIGN KEY ("semester_id") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_schedules" ADD CONSTRAINT "FK_exam_schedules_exam_id" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_schedules" ADD CONSTRAINT "FK_exam_schedules_classroom_id" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_schedules" ADD CONSTRAINT "FK_exam_schedules_invigilator_id" FOREIGN KEY ("invigilator_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_conversations" ADD CONSTRAINT "FK_ai_conversations_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_materials" ADD CONSTRAINT "FK_course_materials_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_materials" ADD CONSTRAINT "FK_course_materials_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_doctor_id" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "warnings" ADD CONSTRAINT "FK_warnings_student_id" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission_id"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role_id"`);
    await queryRunner.query(`ALTER TABLE "warnings" DROP CONSTRAINT "FK_warnings_student_id"`);
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_announcements_doctor_id"`);
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT "FK_announcements_course_id"`);
    await queryRunner.query(`ALTER TABLE "course_materials" DROP CONSTRAINT "FK_course_materials_uploaded_by"`);
    await queryRunner.query(`ALTER TABLE "course_materials" DROP CONSTRAINT "FK_course_materials_course_id"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user_id"`);
    await queryRunner.query(`ALTER TABLE "ai_conversations" DROP CONSTRAINT "FK_ai_conversations_user_id"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user_id"`);
    await queryRunner.query(`ALTER TABLE "exam_schedules" DROP CONSTRAINT "FK_exam_schedules_invigilator_id"`);
    await queryRunner.query(`ALTER TABLE "exam_schedules" DROP CONSTRAINT "FK_exam_schedules_classroom_id"`);
    await queryRunner.query(`ALTER TABLE "exam_schedules" DROP CONSTRAINT "FK_exam_schedules_exam_id"`);
    await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "FK_exams_semester_id"`);
    await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "FK_exams_course_id"`);
    await queryRunner.query(`ALTER TABLE "gpa_history" DROP CONSTRAINT "FK_gpa_history_semester_id"`);
    await queryRunner.query(`ALTER TABLE "gpa_history" DROP CONSTRAINT "FK_gpa_history_student_id"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_graded_by"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_semester_id"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_course_id"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "FK_grades_student_id"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_marked_by"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_lecture_id"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_course_id"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_attendance_student_id"`);
    await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_lectures_doctor_id"`);
    await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_lectures_course_id"`);
    await queryRunner.query(`ALTER TABLE "course_registrations" DROP CONSTRAINT "FK_course_registrations_semester_id"`);
    await queryRunner.query(`ALTER TABLE "course_registrations" DROP CONSTRAINT "FK_course_registrations_course_id"`);
    await queryRunner.query(`ALTER TABLE "course_registrations" DROP CONSTRAINT "FK_course_registrations_student_id"`);
    await queryRunner.query(`ALTER TABLE "course_prerequisites" DROP CONSTRAINT "FK_course_prerequisites_prerequisite_id"`);
    await queryRunner.query(`ALTER TABLE "course_prerequisites" DROP CONSTRAINT "FK_course_prerequisites_course_id"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_doctor_id"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_program_id"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_courses_department_id"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_semester_id"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_academic_year_id"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_program_id"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_department_id"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_students_user_id"`);
    await queryRunner.query(`ALTER TABLE "advisors" DROP CONSTRAINT "FK_advisors_department_id"`);
    await queryRunner.query(`ALTER TABLE "advisors" DROP CONSTRAINT "FK_advisors_user_id"`);
    await queryRunner.query(`ALTER TABLE "tas" DROP CONSTRAINT "FK_tas_supervisor_doctor_id"`);
    await queryRunner.query(`ALTER TABLE "tas" DROP CONSTRAINT "FK_tas_department_id"`);
    await queryRunner.query(`ALTER TABLE "tas" DROP CONSTRAINT "FK_tas_user_id"`);
    await queryRunner.query(`ALTER TABLE "doctors" DROP CONSTRAINT "FK_doctors_department_id"`);
    await queryRunner.query(`ALTER TABLE "doctors" DROP CONSTRAINT "FK_doctors_user_id"`);
    await queryRunner.query(`ALTER TABLE "semesters" DROP CONSTRAINT "FK_semesters_academic_year_id"`);
    await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT "FK_programs_department_id"`);

    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "warnings"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TABLE "course_materials"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "ai_conversations"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "exam_schedules"`);
    await queryRunner.query(`DROP TABLE "classrooms"`);
    await queryRunner.query(`DROP TABLE "exams"`);
    await queryRunner.query(`DROP TABLE "gpa_history"`);
    await queryRunner.query(`DROP TABLE "grades"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP TABLE "lectures"`);
    await queryRunner.query(`DROP TABLE "course_registrations"`);
    await queryRunner.query(`DROP TABLE "course_prerequisites"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "advisors"`);
    await queryRunner.query(`DROP TABLE "tas"`);
    await queryRunner.query(`DROP TABLE "doctors"`);
    await queryRunner.query(`DROP TABLE "semesters"`);
    await queryRunner.query(`DROP TABLE "academic_years"`);
    await queryRunner.query(`DROP TABLE "programs"`);
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."warnings_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."announcements_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."course_materials_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."schedules_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."schedules_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ai_conversations_language_enum"`);
    await queryRunner.query(`DROP TYPE "public"."ai_conversations_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."classrooms_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."exams_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."grades_component_enum"`);
    await queryRunner.query(`DROP TYPE "public"."lectures_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."attendance_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."course_registrations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."semesters_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."programs_degree_enum"`);
    await queryRunner.query(`DROP TYPE "public"."departments_faculty_enum"`);
    await queryRunner.query(`DROP TYPE "public"."doctors_title_enum"`);
    await queryRunner.query(`DROP TYPE "public"."students_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
