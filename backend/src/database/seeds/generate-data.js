const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
const { config } = require('dotenv');
const path = require('path');

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'fee_menouf_platform',
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, '../entities/**/*.entity.js')],
});

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getLevelForIndex(idx) {
  return (idx % 4) + 1;
}

const FIRST_NAMES_AR = ['أحمد','محمد','علي','إبراهيم','عمر','خالد','محمود','حسن','حسين','عبدالله','كريم','سامي','هاني','شريف','أيمن','طارق','نادر','مصطفى','أسماء','فاطمة','مريم','سارة','نورة','هند','داليا','منى','ليلى','جميلة','نادية','سعاد','إيمان','هبة','عزة'];
const LAST_NAMES_AR = ['الشريف','عبد الله','علي','محمد','حسن','حسين','سالم','نصر','عبد الرحمن','عثمان','رفاعي','السيد','أبو العينين','الخطيب','الشربيني','سلامة','الوكيل','الجندي','ناصف','برهام','الصاوي','العناني','الزيني','غانم','مهران','أبو الحسن','الهواري','العتال'];

async function main() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.startTransaction();
    const m = queryRunner.manager;
    
    // Load entities
    const entitiesDir = path.join(__dirname, '../entities/index');
    const { User, Student, Doctor, Ta, Advisor, Department, Program, Course,
      AcademicYear, Semester, CourseRegistration, Grade, Attendance, Lecture,
      Exam, CourseMaterial, Announcement, GpaHistory } = require(entitiesDir);
    
    const UserRole = { SUPER_ADMIN:'SUPER_ADMIN', ADMIN:'ADMIN', DOCTOR:'DOCTOR', TA:'TA', ADVISOR:'ADVISOR', HEAD:'HEAD', STUDENT:'STUDENT' };
    const StudentStatus = { ACTIVE:'ACTIVE' };
    const RegistrationStatus = { APPROVED:'APPROVED' };
    const SemesterType = { FALL:'FALL', SPRING:'SPRING' };
    
    // 1. Check existing data
    const depts = await m.find(Department);
    const courses = await m.find(Course);
    if (depts.length === 0 || courses.length === 0) {
      console.error('ERROR: Run seed.ts first!');
      await queryRunner.rollbackTransaction();
      return;
    }
    console.log(`Found ${depts.length} departments, ${courses.length} courses`);
    
    // 2. Clear test data (keep seed users)
    console.log('\nClearing old test data...');
    await m.query('DELETE FROM "app"."gpa_history"');
    await m.query('DELETE FROM "app"."grades"');
    await m.query('DELETE FROM "app"."attendance"');
    await m.query('DELETE FROM "app"."course_registrations"');
    await m.query('DELETE FROM "app"."announcements"');
    await m.query('DELETE FROM "app"."course_materials"');
    await m.query('DELETE FROM "app"."exams"');
    await m.query('DELETE FROM "app"."exam_schedules"');
    await m.query('DELETE FROM "app"."lectures"');
    
    // Remove non-seed students
    const allUsers = await m.find(User, { where: { role: UserRole.STUDENT } });
    for (const u of allUsers) {
      if (!u.email.startsWith('student')) {
        const s = await m.findOne(Student, { where: { userId: u.id } });
        if (s) await m.delete(Student, s.id);
        await m.delete(User, u.id);
      }
    }
    console.log('Cleared old test data.');
    
    // 3. Load seed users/staff
    const salt = await bcrypt.genSalt(12);
    const pwd = await bcrypt.hash('Demo@12345', salt);
    
    const admin = await m.findOne(User, { where: { email: 'admin@fee-menouf.edu.eg' } });
    const doctorUsers = [];
    const doctorRecords = [];
    
    // Create 4 doctors (one per dept)
    const docEmails = ['doctor-elec@fee-menouf.edu.eg','doctor-com@fee-menouf.edu.eg','doctor-cse@fee-menouf.edu.eg','doctor-pwr@fee-menouf.edu.eg'];
    const docNamesAr = ['د. أحمد محمد','د. سامي عبد الله','د. كريم الشريف','د. هاني الخولي'];
    const docNamesEn = ['Dr. Ahmed Mohamed','Dr. Sami Abdullah','Dr. Karim El-Sherif','Dr. Hani El-Khouly'];
    
    for (let d = 0; d < depts.length; d++) {
      let u = await m.findOne(User, { where: { email: docEmails[d] } });
      if (!u) {
        u = await m.save(User, {
          email: docEmails[d], password: pwd,
          fullNameAr: docNamesAr[d], fullNameEn: docNamesEn[d],
          role: UserRole.DOCTOR, isActive: true, isVerified: true,
        });
      }
      doctorUsers.push(u);
      
      let de = await m.findOne(Doctor, { where: { userId: u.id } });
      if (!de) {
        de = await m.save(Doctor, {
          userId: u.id, employeeId: `DOC${d+1}`.padStart(5,'0'),
          title: 'PROFESSOR', specialization: courses[d % courses.length]?.nameEn || 'General',
          departmentId: depts[d].id, officeLocation: `Building A, Room ${201+d}`,
        });
      }
      doctorRecords.push(de);
    }
    
    // Assign doctors to courses
    for (let c = 0; c < courses.length; c++) {
      courses[c].doctor = doctorRecords[c % doctorRecords.length];
      await m.save(Course, courses[c]);
    }
    
    // 4. Create Academic Years & Semesters
    console.log('\nCreating academic years & semesters...');
    
    const pastAY = await m.findOne(AcademicYear, { where: { year: '2024-2025' } }) || await m.save(AcademicYear, {
      year: '2024-2025', startDate: new Date('2024-09-01'), endDate: new Date('2025-08-31'), isActive: false,
    });
    const fall2024 = await m.findOne(Semester, { where: { nameEn: 'Fall 2024-2025' } }) || await m.save(Semester, {
      nameAr: 'الفصل الدراسي الأول 2024-2025', nameEn: 'Fall 2024-2025',
      type: SemesterType.FALL, academicYearId: pastAY.id,
      startDate: new Date('2024-09-15'), endDate: new Date('2025-01-15'), isActive: false,
    });
    const spring2025 = await m.findOne(Semester, { where: { nameEn: 'Spring 2024-2025' } }) || await m.save(Semester, {
      nameAr: 'الفصل الدراسي الثاني 2024-2025', nameEn: 'Spring 2024-2025',
      type: SemesterType.SPRING, academicYearId: pastAY.id,
      startDate: new Date('2025-02-01'), endDate: new Date('2025-06-30'), isActive: false,
    });
    
    const curAY = await m.findOne(AcademicYear, { where: { year: '2025-2026' } }) || await m.save(AcademicYear, {
      year: '2025-2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-08-31'), isActive: true,
    });
    const curSem = await m.findOne(Semester, { where: { isActive: true } }) || await m.save(Semester, {
      nameAr: 'الفصل الدراسي الأول 2025-2026', nameEn: 'Fall 2025-2026',
      type: SemesterType.FALL, academicYearId: curAY.id,
      startDate: new Date('2025-09-15'), endDate: new Date('2026-01-15'), isActive: true,
    });
    
    const allSemesters = [fall2024, spring2025, curSem];
    
    // 5. Generate Students
    console.log('\nGenerating students...');
    
    const allStudentRecords = [];
    let studentCounter = 11;
    
    for (let d = 0; d < depts.length; d++) {
      for (let n = 0; n < 12; n++) {
        const level = getLevelForIndex(n);
        const fn = pickRandom(FIRST_NAMES_AR);
        const ln = pickRandom(LAST_NAMES_AR);
        const email = `student${studentCounter}@fee-menouf.edu.eg`;
        
        const user = await m.save(User, {
          email, password: pwd,
          fullNameAr: `${fn} ${ln}`,
          fullNameEn: `Student ${studentCounter}`,
          role: UserRole.STUDENT, isActive: true, isVerified: true,
          phone: `0100${randomInt(1000000, 9999999)}`,
        });
        
        const sId = `2024${d+1}${level}${n+1}`.padStart(12, '0');
        const student = await m.save(Student, {
          userId: user.id, studentId: sId,
          nationalId: `2980101${randomInt(10000000, 99999999)}`,
          departmentId: depts[d].id,
          academicYearId: curAY.id, semesterId: curSem.id,
          level, enrollmentDate: new Date('2025-09-15'),
          status: StudentStatus.ACTIVE,
          totalCredits: 0, gpa: 0, cgpa: 0,
        });
        
        allStudentRecords.push({ user, student, deptIdx: d, level });
        studentCounter++;
      }
    }
    console.log(`Total students: ${allStudentRecords.length}`);
    
    // 6. Register students in courses
    console.log('\nRegistering students...');
    let regCount = 0;
    
    for (const s of allStudentRecords) {
      const lvl = s.level;
      const deptPrefix = ['ELC','COM','CSE','PWR'][s.deptIdx];
      
      let selCourses = courses.filter(c => 
        (lvl <= 1 && (c.code.endsWith('101') || c.code.startsWith('MTH') || c.code.startsWith('PHY'))) ||
        (lvl <= 2 && (c.code.endsWith('101') || c.code.endsWith('201'))) ||
        (lvl >= 3 && (c.code.endsWith('201') || c.code.endsWith('301')))
      );
      const deptCourses = courses.filter(c => c.code.startsWith(deptPrefix) && !selCourses.includes(c));
      selCourses = [...selCourses, ...deptCourses].slice(0, 5 + randomInt(0, 2));
      
      for (const course of selCourses) {
        await m.save(CourseRegistration, {
          studentId: s.student.id, courseId: course.id,
          semesterId: curSem.id, status: RegistrationStatus.APPROVED,
          credits: course.credits, createdBy: 'admin', registeredAt: new Date(),
        });
        regCount++;
      }
    }
    console.log(`Registrations: ${regCount}`);
    
    // 7. Generate Grades for past semesters
    console.log('\nGenerating grades...');
    let gradeCount = 0;
    
    for (const sem of [fall2024, spring2025]) {
      for (const s of allStudentRecords) {
        if (s.level <= 1 && sem.id === fall2024.id) {
          // New students didn't exist in Fall 2024
          if (s.student.studentId.startsWith('2024') && s.level <= 1) continue;
        }
        
        const pastCourses = courses.slice(0, 3 + randomInt(0, 2));
        
        for (const course of pastCourses) {
          const mid = randomInt(25, 38);
          const cw = randomInt(12, 19);
          const fin = randomInt(25, 38);
          const total = mid + cw + fin;
          
          for (const g of [
            { component: 'MIDTERM', score: mid, maxScore: 40, weight: 0.4 },
            { component: 'COURSEWORK', score: cw, maxScore: 20, weight: 0.2 },
            { component: 'FINAL', score: fin, maxScore: 40, weight: 0.4 },
            { component: 'TOTAL', score: total, maxScore: 100, weight: 1.0 },
          ]) {
            await m.save(Grade, {
              studentId: s.student.id, courseId: course.id,
              semesterId: sem.id, component: g.component,
              score: g.score, maxScore: g.maxScore, weight: g.weight,
              isPublished: true, gradedAt: sem.endDate,
              gradedById: doctorRecords[0]?.id,
            });
            gradeCount++;
          }
          
          // GPA history
          const gpa = Math.round((total / 100) * 400) / 100;
          const prev = await m.find(GpaHistory, { where: { studentId: s.student.id }, order: { createdAt: 'DESC' } });
          const prevCGPA = prev.length > 0 ? Number(prev[0].cgpa) : 0;
          const prevCredits = prev.length > 0 ? prev[0].totalCredits : 0;
          const newCredits = prevCredits + 3;
          const cgpa = newCredits > 0 ? Math.round(((prevCGPA * prevCredits) + (gpa * 3)) / newCredits * 100) / 100 : gpa;
          
          await m.save(GpaHistory, {
            studentId: s.student.id, semesterId: sem.id,
            semesterGpa: gpa, cgpa: cgpa || gpa,
            totalCredits: newCredits, earnedCredits: 3,
          });
        }
      }
    }
    console.log(`Grades created: ${gradeCount}`);
    
    // 8. Update student GPA/CGPA from history
    for (const s of allStudentRecords) {
      const hist = await m.find(GpaHistory, { where: { studentId: s.student.id }, order: { createdAt: 'DESC' } });
      if (hist.length > 0) {
        const last = hist[0];
        s.student.gpa = last.cgpa || 0;
        s.student.cgpa = last.cgpa || 0;
        s.student.totalCredits = hist.reduce((sum, h) => sum + (h.earnedCredits || 0), 0);
        await m.save(Student, s.student);
      }
    }
    
    // 9. Generate Attendance
    console.log('\nGenerating attendance...');
    let attCount = 0;
    const statuses = ['PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','ABSENT','LATE','EXCUSED'];
    
    for (const s of allStudentRecords) {
      const regs = await m.find(CourseRegistration, { where: { studentId: s.student.id, semesterId: curSem.id } });
      
      for (const reg of regs) {
        const numLectures = randomInt(10, 14);
        
        for (let l = 0; l < numLectures; l++) {
          const lecDate = new Date(curSem.startDate);
          lecDate.setDate(lecDate.getDate() + l * 7);
          if (lecDate > new Date()) continue;
          
          const startHour = 8 + randomInt(0, 8);
          let lec = await m.findOne(Lecture, {
            where: { courseId: reg.courseId, dayOfWeek: lecDate.getDay() },
          });
          
          if (!lec) {
            lec = await m.save(Lecture, {
              courseId: reg.courseId,
              doctorId: doctorRecords[randomInt(0, doctorUsers.length-1)]?.id,
              dayOfWeek: lecDate.getDay(),
              startTime: `${startHour}:00`,
              endTime: `${startHour + 1}:30`,
              type: 'LECTURE',
              room: `Room ${randomInt(101, 305)}`,
              title: `Lecture Week ${l + 1}`,
            });
          }
          
          await m.save(Attendance, {
            studentId: s.student.id, courseId: reg.courseId,
            lectureId: lec.id, date: lecDate,
            status: pickRandom(statuses),
            method: pickRandom(['MANUAL','MANUAL','MANUAL','QR','QR','GEOLOCATION']),
            markedBy: doctorRecords[randomInt(0, doctorUsers.length-1)]?.id,
          });
          attCount++;
        }
      }
    }
    console.log(`Attendance records: ${attCount}`);
    
    // 10. Generate Exams
    console.log('\nGenerating exams...');
    for (const course of courses) {
      await m.save(Exam, { type: 'MIDTERM', date: new Date('2025-11-15'), startTime: '09:00', endTime: '11:00', duration: 120, totalMarks: 40, courseId: course.id, semesterId: curSem.id });
      await m.save(Exam, { type: 'FINAL', date: new Date('2026-01-05'), startTime: '09:00', endTime: '12:00', duration: 180, totalMarks: 40, courseId: course.id, semesterId: curSem.id });
    }
    
    // 11. Generate Materials & Announcements
    console.log('\nGenerating materials & announcements...');
    const materialTypes = ['PDF','PDF','PDF','VIDEO','LINK'];
    const titles = ['المحاضرة الأولى','المحاضرة الثانية','المحاضرة الثالثة','ملخص المادة','تمارين','مصادر إضافية'];
    const announcements = ['تذكير بموعد تسليم الواجب الأسبوعي','تم إضافة مادة جديدة','موعد المحاضرة القادمة','نتائج الامتحان النصفي','تنويه هام بخصوص الجدول'];
    
    for (const course of courses) {
      const nm = randomInt(3, 5);
      for (let i = 0; i < nm; i++) {
        await m.save(CourseMaterial, {
          title: `${pickRandom(titles)} - ${course.nameAr}`,
          type: pickRandom(materialTypes),
          url: `https://materials.fee-menouf.edu.eg/${course.code}/material-${i+1}.pdf`,
          isPublished: true, courseId: course.id,
          uploadedById: doctorRecords[randomInt(0, doctorUsers.length-1)]?.id,
        });
      }
      
      const na = randomInt(2, 3);
      for (let i = 0; i < na; i++) {
        await m.save(Announcement, {
          title: `إعلان ${i+1}: ${course.nameAr}`,
          content: `${pickRandom(announcements)} لمادة ${course.nameAr}. يرجى الالتزام بالمواعيد.`,
          priority: pickRandom(['LOW','MEDIUM','MEDIUM','HIGH']),
          courseId: course.id,
          doctorId: doctorRecords[randomInt(0, doctorUsers.length-1)]?.id,
        });
      }
    }
    
    await queryRunner.commitTransaction();
    
    console.log('\n========================================');
    console.log('  TEST DATA GENERATION COMPLETE');
    console.log('========================================');
    console.log(`  Students: ${allStudentRecords.length}`);
    console.log(`  Each has grades from past 2 semesters`);
    console.log(`  Each has attendance records`);
    console.log(`  All passwords: Demo@12345`);
    console.log('========================================\n');
    
    // Verify
    const tableMap = {'users':'User','students':'Student','doctors':'Doctor','tas':'Ta','advisors':'Advisor','courses':'Course','departments':'Department','academic_years':'AcademicYear','semesters':'Semester','course_registrations':'CourseRegistration','grades':'Grade','attendance':'Attendance','lectures':'Lecture','exams':'Exam','course_materials':'CourseMaterial','announcements':'Announcement','gpa_history':'GpaHistory'};
    console.log('\n=== Verification ===');
    for (const [dbTable, label] of Object.entries(tableMap)) {
      const count = await dataSource.query(`SELECT COUNT(*)::int as cnt FROM "app"."${dbTable}"`);
      console.log(`  ${label}: ${count[0].cnt}`);
    }
    console.log('===================\n');
    
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Failed:', err);
    throw err;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
