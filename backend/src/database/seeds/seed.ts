import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import * as path from 'path';
import {
  User, UserRole, Student, StudentStatus, Doctor, DoctorTitle, Ta, Advisor,
  Department, Faculty, Program, Degree, Course, Semester, SemesterType,
  AcademicYear, CourseRegistration, RegistrationStatus, Classroom, ClassroomType,
  Lecture, LectureType,
} from '../entities';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'fee_menouf_platform',
  synchronize: false,
  logging: true,
  entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
});

async function verifySeedData(manager: any) {
  console.log('\n=== Seed Verification ===');
  const counts = {
    Users: await manager.count(User),
    Departments: await manager.count(Department),
    Programs: await manager.count(Program),
    Courses: await manager.count(Course),
    'Academic Years': await manager.count(AcademicYear),
    Semesters: await manager.count(Semester),
    Students: await manager.count(Student),
    Doctors: await manager.count(Doctor),
    'TAs': await manager.count(Ta),
    Advisors: await manager.count(Advisor),
    Classrooms: await manager.count(Classroom),
    Lectures: await manager.count(Lecture),
    'Course Registrations': await manager.count(CourseRegistration),
  };
  for (const [label, count] of Object.entries(counts)) {
    console.log(`  ${label}: ${count}`);
  }
  console.log('=== Verification Complete ===\n');
}

async function clearDemoData(manager: any) {
  console.log('Clearing existing demo data...');
  const entities = [CourseRegistration, Lecture, Student, Ta, Advisor, Doctor, Course, Semester, AcademicYear, Program, Classroom, User, Department];
  for (const entity of entities) {
    await manager.createQueryBuilder().delete().from(entity).execute();
  }
  console.log('Demo data cleared.');
}

async function seed() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.startTransaction();
    const manager = queryRunner.manager;

    const existingUsers = await manager.count(User);
    if (existingUsers > 0) {
      console.log('=== DEMO ACCOUNTS (FOR DEVELOPMENT ONLY) ===');
      console.log('  WARNING: These credentials are for local development only!');
      console.log('  Change all passwords immediately in production!');
      console.log('Database already seeded. Use "seed.ts --rollback" to clear and re-seed.');
      console.log('============================================');
      await verifySeedData(manager);
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Demo@12345', salt);

    const departments = await manager.save(Department, [
      { nameAr: 'هندسة الإلكترونيات', nameEn: 'Electronics Engineering', code: 'ELC', faculty: Faculty.FE_ELECTRONIC_ENGINEERING, description: 'Electronics and communication engineering department' },
      { nameAr: 'هندسة الاتصالات', nameEn: 'Communications Engineering', code: 'COM', faculty: Faculty.FE_ELECTRONIC_ENGINEERING, description: 'Communications engineering department' },
      { nameAr: 'هندسة الحاسبات', nameEn: 'Computer Engineering', code: 'CSE', faculty: Faculty.FE_ELECTRONIC_ENGINEERING, description: 'Computer and systems engineering department' },
      { nameAr: 'هندسة القوى', nameEn: 'Power Engineering', code: 'PWR', faculty: Faculty.FE_ELECTRONIC_ENGINEERING, description: 'Electrical power engineering department' },
    ]);

    const programs = await manager.save(Program, [
      { nameAr: 'بكالوريوس هندسة الإلكترونيات', nameEn: 'BSc in Electronics Engineering', code: 'BSC-ELC', departmentId: departments[0].id, duration: 4, totalCredits: 160, degree: Degree.BACHELOR },
      { nameAr: 'بكالوريوس هندسة الاتصالات', nameEn: 'BSc in Communications Engineering', code: 'BSC-COM', departmentId: departments[1].id, duration: 4, totalCredits: 160, degree: Degree.BACHELOR },
      { nameAr: 'بكالوريوس هندسة الحاسبات', nameEn: 'BSc in Computer Engineering', code: 'BSC-CSE', departmentId: departments[2].id, duration: 4, totalCredits: 160, degree: Degree.BACHELOR },
      { nameAr: 'بكالوريوس هندسة القوى', nameEn: 'BSc in Power Engineering', code: 'BSC-PWR', departmentId: departments[3].id, duration: 4, totalCredits: 160, degree: Degree.BACHELOR },
    ]);

    const acadYear = await manager.save(AcademicYear, {
      year: '2025-2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-08-31'), isActive: true,
    });

    const semester = await manager.save(Semester, {
      nameAr: 'الفصل الدراسي الأول 2025-2026', nameEn: 'Fall Semester 2025-2026',
      type: SemesterType.FALL, academicYearId: acadYear.id,
      startDate: new Date('2025-09-15'), endDate: new Date('2026-01-15'),
      registrationStart: new Date('2025-08-15'), registrationEnd: new Date('2025-09-30'),
      isActive: true,
    });

    const courses = await manager.save(Course, [
      { code: 'ELC101', nameAr: 'أساسيات الإلكترونيات', nameEn: 'Fundamentals of Electronics', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[0].id, programId: programs[0].id, capacity: 100, maxStudents: 90 },
      { code: 'ELC201', nameAr: 'دوائر إلكترونية', nameEn: 'Electronic Circuits', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[0].id, programId: programs[0].id, capacity: 80, maxStudents: 75 },
      { code: 'COM101', nameAr: 'مقدمة في الاتصالات', nameEn: 'Introduction to Communications', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[1].id, programId: programs[1].id, capacity: 100, maxStudents: 90 },
      { code: 'CSE101', nameAr: 'مقدمة في علوم الحاسب', nameEn: 'Introduction to Computer Science', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[2].id, programId: programs[2].id, capacity: 120, maxStudents: 100 },
      { code: 'CSE201', nameAr: 'برمجة كائنية', nameEn: 'Object-Oriented Programming', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[2].id, programId: programs[2].id, capacity: 100, maxStudents: 90 },
      { code: 'CSE301', nameAr: 'قواعد البيانات', nameEn: 'Database Systems', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[2].id, programId: programs[2].id, capacity: 80, maxStudents: 75 },
      { code: 'PWR101', nameAr: 'أساسيات القوى الكهربية', nameEn: 'Fundamentals of Electrical Power', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[3].id, programId: programs[3].id, capacity: 100, maxStudents: 90 },
      { code: 'MTH101', nameAr: 'رياضيات هندسية 1', nameEn: 'Engineering Mathematics I', credits: 3, lectureHours: 3, labHours: 0, departmentId: departments[0].id, capacity: 200, maxStudents: 180 },
      { code: 'MTH201', nameAr: 'رياضيات هندسية 2', nameEn: 'Engineering Mathematics II', credits: 3, lectureHours: 3, labHours: 0, departmentId: departments[0].id, capacity: 200, maxStudents: 180 },
      { code: 'PHY101', nameAr: 'فيزياء هندسية', nameEn: 'Engineering Physics', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[0].id, capacity: 200, maxStudents: 180 },
      { code: 'COM201', nameAr: 'أنظمة الاتصالات', nameEn: 'Communication Systems', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[1].id, programId: programs[1].id, capacity: 80, maxStudents: 75 },
      { code: 'CSE202', nameAr: 'هياكل البيانات', nameEn: 'Data Structures', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[2].id, programId: programs[2].id, capacity: 100, maxStudents: 90 },
      { code: 'CSE302', nameAr: 'هندسة البرمجيات', nameEn: 'Software Engineering', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[2].id, programId: programs[2].id, capacity: 80, maxStudents: 75 },
      { code: 'PWR201', nameAr: 'آلات كهربية', nameEn: 'Electrical Machines', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[3].id, programId: programs[3].id, capacity: 80, maxStudents: 75 },
      { code: 'ELC301', nameAr: 'إلكترونيات رقمية', nameEn: 'Digital Electronics', credits: 3, lectureHours: 2, labHours: 2, departmentId: departments[0].id, programId: programs[0].id, capacity: 80, maxStudents: 75 },
    ]);

    const superAdmin = await manager.save(User, {
      email: 'superadmin@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'المشرف العام', fullNameEn: 'Super Admin',
      role: UserRole.SUPER_ADMIN, isActive: true, isVerified: true,
    });

    const admin = await manager.save(User, {
      email: 'admin@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'مسؤول النظام', fullNameEn: 'System Administrator',
      role: UserRole.ADMIN, isActive: true, isVerified: true,
    });

    const doctor = await manager.save(User, {
      email: 'doctor@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'د. أحمد محمد', fullNameEn: 'Dr. Ahmed Mohamed',
      role: UserRole.DOCTOR, isActive: true, isVerified: true,
    });

    const doctorEntity = await manager.save(Doctor, {
      userId: doctor.id, employeeId: 'DOC001',
      title: DoctorTitle.PROFESSOR, specialization: 'Electronic Circuits',
      departmentId: departments[0].id, officeLocation: 'Building A, Room 201',
    });

    const ta = await manager.save(User, {
      email: 'ta@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'م. محمود علي', fullNameEn: 'Eng. Mahmoud Ali',
      role: UserRole.TA, isActive: true, isVerified: true,
    });

    await manager.save(Ta, {
      userId: ta.id, employeeId: 'TA001', departmentId: departments[2].id, supervisorDoctorId: doctorEntity.id,
    });

    const ta2 = await manager.save(User, {
      email: 'ta2@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'م. نورهان سعيد', fullNameEn: 'Eng. Nourhan Said',
      role: UserRole.TA, isActive: true, isVerified: true,
    });

    await manager.save(Ta, {
      userId: ta2.id, employeeId: 'TA002', departmentId: departments[0].id, supervisorDoctorId: doctorEntity.id,
    });

    const ta3 = await manager.save(User, {
      email: 'ta3@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'م. أحمد عبدالله', fullNameEn: 'Eng. Ahmed Abdallah',
      role: UserRole.TA, isActive: true, isVerified: true,
    });

    await manager.save(Ta, {
      userId: ta3.id, employeeId: 'TA003', departmentId: departments[1].id, supervisorDoctorId: doctorEntity.id,
    });

    const advisor = await manager.save(User, {
      email: 'advisor@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'د. سارة أحمد', fullNameEn: 'Dr. Sara Ahmed',
      role: UserRole.ADVISOR, isActive: true, isVerified: true,
    });

    await manager.save(Advisor, {
      userId: advisor.id, employeeId: 'ADV001', departmentId: departments[0].id, maxStudents: 30,
    });

    const head = await manager.save(User, {
      email: 'head@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'د. خالد حسن', fullNameEn: 'Dr. Khaled Hassan',
      role: UserRole.HEAD, isActive: true, isVerified: true,
    });

    const doctor2 = await manager.save(User, {
      email: 'doctor2@fee-menouf.edu.eg', password: hashedPassword,
      fullNameAr: 'د. منى جمال', fullNameEn: 'Dr. Mona Gamal',
      role: UserRole.DOCTOR, isActive: true, isVerified: true,
    });

    await manager.save(Doctor, {
      userId: doctor2.id, employeeId: 'DOC002',
      title: DoctorTitle.ASSOCIATE, specialization: 'Communication Systems',
      departmentId: departments[1].id, officeLocation: 'Building A, Room 105',
    });

    const studentsData = [];
    for (let i = 1; i <= 10; i++) {
      const studentUser = await manager.save(User, {
        email: `student${i}@fee-menouf.edu.eg`, password: hashedPassword,
        fullNameAr: `طالب ${i}`, fullNameEn: `Student ${i}`,
        role: UserRole.STUDENT, isActive: true, isVerified: true,
      });
      studentsData.push(studentUser);
    }

    const classrooms = await manager.save(Classroom, [
      { name: 'قاعة A1', code: 'A1', type: ClassroomType.LECTURE_HALL, capacity: 100, building: 'Main Building', floor: 1, hasProjector: true, hasComputers: false },
      { name: 'قاعة A2', code: 'A2', type: ClassroomType.LECTURE_HALL, capacity: 80, building: 'Main Building', floor: 1, hasProjector: true, hasComputers: false },
      { name: 'مختبر B1', code: 'B1', type: ClassroomType.LAB, capacity: 30, building: 'Lab Building', floor: 1, hasProjector: false, hasComputers: true },
      { name: 'مختبر B2', code: 'B2', type: ClassroomType.LAB, capacity: 25, building: 'Lab Building', floor: 1, hasProjector: true, hasComputers: true },
      { name: 'قاعة A3', code: 'A3', type: ClassroomType.LECTURE_HALL, capacity: 120, building: 'Main Building', floor: 2, hasProjector: true, hasComputers: false },
      { name: 'مختبر B3', code: 'B3', type: ClassroomType.LAB, capacity: 30, building: 'Lab Building', floor: 2, hasProjector: true, hasComputers: true },
    ]);

    let studentIndex = 1;
    for (const dept of departments) {
      for (let j = 0; j < 2; j++) {
        const user = studentsData[(studentIndex - 1)];
        await manager.save(Student, {
          userId: user.id,
          studentId: `${20240000 + studentIndex}`,
          nationalId: `2980101${String(studentIndex).padStart(9, '0')}`,
          departmentId: dept.id, programId: programs[departments.indexOf(dept)].id,
          academicYearId: acadYear.id, semesterId: semester.id,
          level: 1, enrollmentDate: new Date('2025-09-15'),
          status: StudentStatus.ACTIVE, totalCredits: 0, gpa: 0, cgpa: 0,
        });
        studentIndex++;
      }
    }

    const allStudents = await manager.find(Student);
    const allCourses = await manager.find(Course);
    for (const student of allStudents) {
      const numCourses = 3 + (allStudents.indexOf(student) % 3);
      for (let j = 0; j < numCourses && j < allCourses.length; j++) {
        await manager.save(CourseRegistration, {
          studentId: student.id, courseId: allCourses[j].id,
          semesterId: semester.id, status: RegistrationStatus.APPROVED,
          credits: allCourses[j].credits, createdBy: admin.id,
        });
      }
    }

    const allDoctors = await manager.find(Doctor);
    const daysOfWeek = [0, 1, 2, 3, 4];
    const startTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
    for (let i = 0; i < allCourses.length; i++) {
      const course = allCourses[i];
      const doctor = allDoctors[i % allDoctors.length];
      const classroom = classrooms[i % classrooms.length];
      const day = daysOfWeek[i % daysOfWeek.length];
      const timeIdx = i % startTimes.length;
      const endTimeIdx = Math.min(timeIdx + 2, startTimes.length - 1);
      await manager.save(Lecture, {
        courseId: course.id,
        doctorId: doctor.id,
        classroomId: classroom.id,
        dayOfWeek: day,
        startTime: startTimes[timeIdx],
        endTime: startTimes[endTimeIdx],
        type: LectureType.LECTURE,
        title: `Lecture: ${course.nameAr}`,
        room: classroom.name,
      });
    }

    await queryRunner.commitTransaction();
    console.log('\n=== DEMO ACCOUNTS (FOR DEVELOPMENT ONLY) ===');
    console.log('  WARNING: These credentials are for local development only!');
    console.log('  Change all passwords immediately in production!');
    console.log('  superadmin@fee-menouf.edu.eg / Demo@12345 (SUPER_ADMIN)');
    console.log('  admin@fee-menouf.edu.eg / Demo@12345 (ADMIN)');
    console.log('  doctor@fee-menouf.edu.eg / Demo@12345 (DOCTOR)');
    console.log('  ta@fee-menouf.edu.eg / Demo@12345 (TA)');
    console.log('  advisor@fee-menouf.edu.eg / Demo@12345 (ADVISOR)');
    console.log('  head@fee-menouf.edu.eg / Demo@12345 (HEAD)');
    console.log('  student1-10@fee-menouf.edu.eg / Demo@12345 (STUDENT)');
    console.log('============================================');
    await verifySeedData(manager);
    console.log('Seeding completed successfully!');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

async function rollback() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.startTransaction();
    const manager = queryRunner.manager;
    const existingUsers = await manager.count(User);
    if (existingUsers === 0) {
      console.log('No demo data found to rollback.');
      return;
    }
    await clearDemoData(manager);
    await queryRunner.commitTransaction();
    console.log('Rollback completed successfully.');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Rollback failed:', err);
    throw err;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

const args = process.argv.slice(2);
if (args.includes('--rollback')) {
  rollback().catch(console.error);
} else {
  seed().catch(console.error);
}
