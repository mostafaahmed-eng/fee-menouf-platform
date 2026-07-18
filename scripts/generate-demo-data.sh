#!/usr/bin/env bash
set -o errexit
set -o pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_done()  { echo -e "${GREEN}[DONE]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.local.yml"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-fee_menouf_platform}"

log_info "Generating comprehensive demo data..."

# Generate lectures for current semester
PSQL="docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1"

log_info "Creating lectures for each course..."
echo "
DO \$\$
DECLARE
    cur_sem RECORD;
    c RECORD;
    lec_count INT;
    day_offset INT;
    lec_date DATE;
    start_h INT;
    room_txt TEXT;
BEGIN
    SELECT id, start_date, end_date INTO cur_sem FROM app.semesters WHERE is_active = true LIMIT 1;

    FOR c IN SELECT * FROM app.courses WHERE is_active = true LOOP
        lec_count := 10 + floor(random() * 5)::int;
        FOR week IN 1..lec_count LOOP
            day_offset := (week - 1) * 7;
            lec_date := cur_sem.start_date + day_offset;
            IF lec_date > CURRENT_DATE THEN EXIT; END IF;
            start_h := 8 + floor(random() * 9)::int;
            room_txt := 'Room ' || (100 + floor(random() * 300)::int)::text;
            INSERT INTO app.lectures (course_id, title, day_of_week, start_time, end_time, type, room, created_at, updated_at)
            VALUES (
                c.id,
                'Lecture Week ' || week || ' - ' || c.name_en,
                EXTRACT(DOW FROM lec_date)::int,
                (start_h || ':00')::time,
                ((start_h + 1) || ':30')::time,
                (CASE WHEN floor(random() * 3) = 0 THEN 'LAB' ELSE 'LECTURE' END)::lectures_type_enum,
                room_txt,
                NOW(), NOW()
            ) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Lectures created."

log_info "Generating attendance records..."
echo "
DO \$\$
DECLARE
    s RECORD;
    lec RECORD;
    reg RECORD;
    at_count INT := 0;
BEGIN
    FOR s IN SELECT * FROM app.students WHERE status = 'ACTIVE'::students_status_enum LOOP
        FOR reg IN SELECT * FROM app.course_registrations cr
            JOIN app.semesters sem ON sem.id = cr.semester_id
            WHERE cr.student_id = s.id AND sem.is_active = true
        LOOP
            FOR lec IN SELECT * FROM app.lectures WHERE course_id = reg.course_id ORDER BY created_at LIMIT 12 LOOP
                INSERT INTO app.attendance (student_id, course_id, lecture_id, date, status, method, created_at)
                VALUES (
                    s.id, reg.course_id, lec.id,
                    lec.created_at::date,
                    (ARRAY['PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','ABSENT','LATE','EXCUSED'])[1 + floor(random() * 10)::int]::attendance_status_enum,
                    (ARRAY['MANUAL','MANUAL','MANUAL','QR','QR','GEOLOCATION'])[1 + floor(random() * 6)::int]::attendance_method_enum,
                    NOW()
                ) ON CONFLICT DO NOTHING;
                at_count := at_count + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Attendance records created."

log_info "Generating exams..."
echo "
DO \$\$
DECLARE
    c RECORD;
    cur_sem_id UUID;
BEGIN
    SELECT id INTO cur_sem_id FROM app.semesters WHERE is_active = true LIMIT 1;
    FOR c IN SELECT * FROM app.courses WHERE is_active = true LOOP
        INSERT INTO app.exams (course_id, semester_id, type, date, start_time, end_time, duration, total_marks, created_at)
        VALUES
            (c.id, cur_sem_id, 'MIDTERM'::exams_type_enum, '2025-11-15'::date, '09:00'::time, '11:00'::time, 120, 40, NOW()),
            (c.id, cur_sem_id, 'FINAL'::exams_type_enum, '2026-01-05'::date, '09:00'::time, '12:00'::time, 180, 60, NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Exams created."

log_info "Generating grades and GPA history..."
echo "
DO \$\$
DECLARE
    s RECORD;
    reg RECORD;
    mid_score INT;
    cw_score INT;
    fin_score INT;
    total_score INT;
    gpa_val NUMERIC;
    prev_cgpa NUMERIC := 0;
    prev_credits INT := 0;
    new_credits INT;
    new_cgpa NUMERIC;
    sem RECORD;
    grade_count INT := 0;
    sem_id UUID;
BEGIN
    -- Use current semester as primary grade target (students have registrations there)
    SELECT id INTO sem_id FROM app.semesters WHERE is_active = true LIMIT 1;

    FOR s IN SELECT * FROM app.students WHERE status = 'ACTIVE'::students_status_enum LOOP
        SELECT cgpa, total_credits INTO prev_cgpa, prev_credits
        FROM app.gpa_history WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1;
        IF prev_cgpa IS NULL THEN prev_cgpa := 0; END IF;
        IF prev_credits IS NULL THEN prev_credits := 0; END IF;

        FOR reg IN SELECT * FROM app.course_registrations WHERE student_id = s.id LIMIT 4 LOOP
            mid_score := 25 + floor(random() * 15)::int;
            cw_score := 12 + floor(random() * 8)::int;
            fin_score := 25 + floor(random() * 15)::int;
            total_score := mid_score + cw_score + fin_score;

            INSERT INTO app.grades (student_id, course_id, semester_id, component, score, max_score, weight, is_published, graded_at, created_at)
            VALUES
                (s.id, reg.course_id, reg.semester_id, 'MIDTERM', mid_score, 40, 0.4, true, NOW(), NOW()),
                (s.id, reg.course_id, reg.semester_id, 'COURSEWORK', cw_score, 20, 0.2, true, NOW(), NOW()),
                (s.id, reg.course_id, reg.semester_id, 'FINAL', fin_score, 40, 0.4, true, NOW(), NOW()),
                (s.id, reg.course_id, reg.semester_id, 'TOTAL', total_score, 100, 1.0, true, NOW(), NOW())
            ON CONFLICT DO NOTHING;

            gpa_val := ROUND((total_score::numeric / 100) * 4, 2);
            new_credits := prev_credits + 3;
            new_cgpa := ROUND(((prev_cgpa * prev_credits) + (gpa_val * 3)) / NULLIF(new_credits, 0), 2);
            IF new_cgpa IS NULL OR new_cgpa = 0 THEN new_cgpa := gpa_val; END IF;

            INSERT INTO app.gpa_history (student_id, semester_id, semester_gpa, cgpa, total_credits, earned_credits, created_at)
            VALUES (s.id, reg.semester_id, gpa_val, new_cgpa, new_credits, 3, NOW())
            ON CONFLICT DO NOTHING;

            grade_count := grade_count + 1;
            prev_cgpa := new_cgpa;
            prev_credits := new_credits;
        END LOOP;
    END LOOP;

    -- Update student GPAs
    FOR s IN SELECT * FROM app.students WHERE status = 'ACTIVE'::students_status_enum LOOP
        SELECT semester_gpa, cgpa, total_credits INTO prev_cgpa, prev_cgpa, prev_credits
        FROM app.gpa_history WHERE student_id = s.id ORDER BY created_at DESC LIMIT 1;
        IF prev_cgpa IS NOT NULL THEN
            UPDATE app.students SET gpa = prev_cgpa, cgpa = prev_cgpa, total_credits = prev_credits WHERE id = s.id;
        END IF;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Grades and GPA history created."

log_info "Creating course materials..."
echo "
DO \$\$
DECLARE
    c RECORD;
    doc_id UUID;
BEGIN
    SELECT d.id INTO doc_id FROM app.doctors d JOIN app.users u ON u.id = d.user_id LIMIT 1;

    FOR c IN SELECT * FROM app.courses WHERE is_active = true LOOP
        INSERT INTO app.course_materials (course_id, title, type, url, is_published, uploaded_by, uploaded_at)
        VALUES
            (c.id, 'Lecture Notes - ' || c.name_en, 'PDF'::course_materials_type_enum, 'https://materials.fee-menouf.edu.eg/' || c.code || '/notes.pdf', true, doc_id, NOW()),
            (c.id, 'Summary - ' || c.name_en, 'DOC'::course_materials_type_enum, 'https://materials.fee-menouf.edu.eg/' || c.code || '/summary.doc', true, doc_id, NOW()),
            (c.id, 'Exercises - ' || c.name_en, 'LINK'::course_materials_type_enum, 'https://materials.fee-menouf.edu.eg/' || c.code || '/exercises', true, doc_id, NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Course materials created."

log_info "Creating announcements..."
echo "
DO \$\$
DECLARE
    c RECORD;
    doc_id UUID;
    priorities announcements_priority_enum[] := ARRAY['LOW','MEDIUM','MEDIUM','HIGH']::announcements_priority_enum[];
    contents TEXT[] := ARRAY[
        'Reminder: Assignment submission deadline is next week.',
        'New course material has been uploaded. Please check.',
        'Office hours have been updated for this week.',
        'Midterm exam results are now available.',
        'Important: Schedule change for next lecture.',
        'Guest lecture this Thursday. Attendance is mandatory.'
    ];
BEGIN
    SELECT d.id INTO doc_id FROM app.doctors d JOIN app.users u ON u.id = d.user_id LIMIT 1;

    FOR c IN SELECT * FROM app.courses WHERE is_active = true LOOP
        INSERT INTO app.announcements (course_id, doctor_id, title, content, priority, created_at)
        VALUES (
            c.id, doc_id,
            'Announcement for ' || c.name_en,
            contents[1 + floor(random() * array_length(contents, 1))::int],
            priorities[1 + floor(random() * array_length(priorities, 1))::int],
            NOW() - (2 || ' days')::interval
        ) ON CONFLICT DO NOTHING;
        INSERT INTO app.announcements (course_id, doctor_id, title, content, priority, created_at)
        VALUES (
            c.id, doc_id,
            'Important Update - ' || c.name_en,
            contents[1 + floor(random() * array_length(contents, 1))::int],
            priorities[1 + floor(random() * array_length(priorities, 1))::int],
            NOW()
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Announcements created."

log_info "Creating notifications for all users..."
echo "
DO \$\$
DECLARE
    u RECORD;
    msgs TEXT[] := ARRAY[
        'Welcome to the new academic year 2025-2026!',
        'Please complete your course registration.',
        'Your grades have been updated.',
        'New announcement from your department.',
        'Attendance report is now available.',
        'Schedule for next week has been published.'
    ];
BEGIN
    FOR u IN SELECT * FROM app.users WHERE is_active = true LIMIT 20 LOOP
        INSERT INTO app.notifications (user_id, title, message, type, is_read, created_at)
        VALUES (
            u.id,
            'Notification - ' || msgs[1 + floor(random() * array_length(msgs, 1))::int],
            msgs[1 + floor(random() * array_length(msgs, 1))::int],
            (ARRAY['REGISTRATION','GRADE','ATTENDANCE','EXAM','DEADLINE','WARNING','GENERAL'])[1 + floor(random() * 7)::int]::notifications_type_enum,
            floor(random() * 2)::int = 0,
            NOW() - (1 || ' days')::interval
        ) ON CONFLICT DO NOTHING;
        INSERT INTO app.notifications (user_id, title, message, type, is_read, created_at)
        VALUES (
            u.id,
            'Reminder - ' || msgs[1 + floor(random() * array_length(msgs, 1))::int],
            msgs[1 + floor(random() * array_length(msgs, 1))::int],
            (ARRAY['REGISTRATION','GRADE','ATTENDANCE','EXAM','DEADLINE','WARNING','GENERAL'])[1 + floor(random() * 7)::int]::notifications_type_enum,
            floor(random() * 2)::int = 0,
            NOW() - (3 || ' days')::interval
        ) ON CONFLICT DO NOTHING;
        INSERT INTO app.notifications (user_id, title, message, type, is_read, created_at)
        VALUES (
            u.id,
            'Update - ' || msgs[1 + floor(random() * array_length(msgs, 1))::int],
            msgs[1 + floor(random() * array_length(msgs, 1))::int],
            (ARRAY['REGISTRATION','GRADE','ATTENDANCE','EXAM','DEADLINE','WARNING','GENERAL'])[1 + floor(random() * 7)::int]::notifications_type_enum,
            floor(random() * 2)::int = 0,
            NOW()
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Notifications created."

log_info "Creating schedule data..."
echo "
DO \$\$
DECLARE
    cur_sem_id UUID;
    dept_id UUID;
    sem RECORD;
    slot_data JSONB;
BEGIN
    SELECT id INTO cur_sem_id FROM app.semesters WHERE is_active = true LIMIT 1;
    SELECT id INTO dept_id FROM app.departments LIMIT 1;

    FOR sem IN SELECT * FROM app.semesters WHERE is_active = true LIMIT 1 LOOP
        slot_data := '{\"slots\": [{\"day\": \"Sunday\", \"time\": \"08:00-09:30\", \"course\": \"\"}, {\"day\": \"Monday\", \"time\": \"10:00-11:30\", \"course\": \"\"}]}'::jsonb;
        INSERT INTO app.schedules (type, title, data, status, semester_id, department_id, created_at)
        VALUES
            ('LECTURE'::schedules_type_enum, 'Fall 2025 Schedule', slot_data, 'PUBLISHED'::schedules_status_enum, cur_sem_id, dept_id, NOW())
        ON CONFLICT DO NOTHING;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Schedule data created."

log_info "Creating AI conversation history..."
echo "
DO \$\$
DECLARE
    u RECORD;
    session_prefix TEXT;
    questions TEXT[] := ARRAY[
        'What are the prerequisites for this course?',
        'Can you explain the concept of Fourier Transform?',
        'How do I calculate the GPA for this semester?',
        'Explain the difference between analog and digital signals.',
        'What are the main topics covered in the midterm exam?',
        'How can I improve my grade in this course?'
    ];
    answers TEXT[] := ARRAY[
        'The prerequisites are Basic Mathematics and Physics. You should have completed MATH101 and PHY101 before taking this course.',
        'The Fourier Transform is a mathematical technique that transforms a signal from its time domain to its frequency domain. It is fundamental to signal processing and communications.',
        'GPA = (sum of (grade_points × credit_hours)) / total_credit_hours. Each grade corresponds to points: A=4.0, B=3.0, C=2.0, D=1.0, F=0.0.',
        'Analog signals are continuous in both time and amplitude, while digital signals are discrete in both. Digital signals are more resistant to noise but require more bandwidth.',
        'The midterm covers chapters 1-5 including fundamental concepts, theories, and practical applications. Focus on the topics discussed in lectures and lab sessions.',
        'Regular attendance, active participation in tutorials, completing assignments on time, and reviewing course materials regularly can significantly improve your performance.'
    ];
BEGIN
    FOR u IN SELECT * FROM app.users WHERE role = 'STUDENT' AND is_active = true LIMIT 5 LOOP
        session_prefix := 'session-' || u.id || '-' || extract(epoch from now())::bigint::text;
        INSERT INTO app.ai_conversations (user_id, session_id, role, content, language, tokens_used, timestamp)
        VALUES (
            u.id, session_prefix,
            'USER'::ai_conversations_role_enum,
            questions[1 + floor(random() * array_length(questions, 1))::int],
            'EN'::ai_conversations_language_enum,
            10 + floor(random() * 50)::int,
            NOW() - (5 || ' days')::interval
        ) ON CONFLICT DO NOTHING;
        INSERT INTO app.ai_conversations (user_id, session_id, role, content, language, tokens_used, timestamp)
        VALUES (
            u.id, session_prefix,
            'ASSISTANT'::ai_conversations_role_enum,
            answers[1 + floor(random() * array_length(answers, 1))::int],
            'EN'::ai_conversations_language_enum,
            100 + floor(random() * 300)::int,
            NOW() - (5 || ' days')::interval + interval '1 second'
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END \$\$;
" | $PSQL
log_done "AI conversation history created."

log_info "Creating warnings for students..."
echo "
DO \$\$
DECLARE
    s RECORD;
    advisor_u UUID;
    staff_id UUID;
BEGIN
    SELECT d.id INTO staff_id FROM app.doctors d LIMIT 1;

    -- Attendance warnings
    FOR s IN SELECT * FROM app.students WHERE status = 'ACTIVE'::students_status_enum LIMIT 2 LOOP
        INSERT INTO app.warnings (student_id, type, reason, action, created_at)
        VALUES (
            s.id,
            'ATTENDANCE'::warnings_type_enum,
            'Your attendance record shows multiple absences in recent lectures.',
            'Please ensure regular attendance to avoid further academic consequences.',
            NOW()
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Academic warning
    FOR s IN SELECT * FROM app.students WHERE status = 'ACTIVE'::students_status_enum OFFSET 1 LIMIT 1 LOOP
        INSERT INTO app.warnings (student_id, type, reason, action, created_at)
        VALUES (
            s.id,
            'ACADEMIC'::warnings_type_enum,
            'Your academic performance requires improvement based on recent assessment results.',
            'Contact your academic advisor to discuss a study improvement plan.',
            NOW()
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END \$\$;
" | $PSQL
log_done "Warnings created."

echo ""
log_info "========================================="
log_info "  DEMO DATA GENERATION COMPLETE!"
log_info "========================================="

# Show final counts
echo ""
echo "SELECT 'users' as tbl, count(*)::text as cnt from app.users UNION ALL
SELECT 'students', count(*)::text from app.students UNION ALL
SELECT 'doctors', count(*)::text from app.doctors UNION ALL
SELECT 'courses', count(*)::text from app.courses UNION ALL
SELECT 'lectures', count(*)::text from app.lectures UNION ALL
SELECT 'attendance', count(*)::text from app.attendance UNION ALL
SELECT 'grades', count(*)::text from app.grades UNION ALL
SELECT 'gpa_history', count(*)::text from app.gpa_history UNION ALL
SELECT 'exams', count(*)::text from app.exams UNION ALL
SELECT 'course_materials', count(*)::text from app.course_materials UNION ALL
SELECT 'announcements', count(*)::text from app.announcements UNION ALL
SELECT 'notifications', count(*)::text from app.notifications UNION ALL
SELECT 'schedules', count(*)::text from app.schedules UNION ALL
SELECT 'ai_conversations', count(*)::text from app.ai_conversations UNION ALL
SELECT 'warnings', count(*)::text from app.warnings ORDER BY tbl;" | $PSQL | head -30
echo ""
log_done "All demo data generated successfully!"
