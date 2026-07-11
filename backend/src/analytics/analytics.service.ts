import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Student, StudentStatus } from '../database/entities/student.entity';
import { Course } from '../database/entities/course.entity';
import { Grade, GradeComponent } from '../database/entities/grade.entity';
import { CourseRegistration, RegistrationStatus } from '../database/entities/course-registration.entity';
import { Attendance } from '../database/entities/attendance.entity';
import { Department } from '../database/entities/department.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { GpaHistory } from '../database/entities/gpa-history.entity';

export interface StudentAnalyticsResult {
  studentId: string; name: string; department: string | undefined;
  level: number; currentGpa: number | null; totalCredits: number;
  academicWarnings: number; gpaTrend: { semester: string; gpa: number; cgpa: number }[];
  overallAttendanceRate: number; totalAttendances: number;
}

export interface CourseAnalyticsResult {
  courseCode: string; courseName: string; department: string | undefined;
  credits: number; totalRegistered: number; totalGraded: number;
  passed: number; failed: number; failureRate: number;
  averageMarks: number; maxMarks: number; minMarks: number;
}

interface FailureRateItem { courseCode: string; courseName: string; department?: string; totalStudents: number; failedStudents: number; failureRate: number; averageMarks: number; }
interface WorkloadItem { doctorId: string; name: string; department: string | undefined; title: string | undefined; activeCourses: number; workloadLevel: string; }

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(CourseRegistration)
    private readonly registrationRepo: Repository<CourseRegistration>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(GpaHistory)
    private readonly gpaHistoryRepo: Repository<GpaHistory>,
  ) {}

  async getStudentAnalytics(studentId: string): Promise<StudentAnalyticsResult> {
    const student = await this.studentRepo.findOne({
      where: { studentId },
      relations: ['department', 'user'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const gpaHistory = await this.gpaHistoryRepo.find({
      where: { studentId: student.id },
      relations: ['semester'],
      order: { createdAt: 'ASC' },
    });

    const grades = await this.gradeRepo.find({
      where: { studentId: student.id, component: GradeComponent.TOTAL },
      relations: ['course', 'semester'],
      order: { createdAt: 'ASC' },
    });

    const attendances = await this.attendanceRepo.find({
      where: { studentId: student.id },
      order: { createdAt: 'ASC' },
    });

    const gpaTrend = gpaHistory.map((h) => ({
      semester: h.semester?.nameEn || 'N/A',
      gpa: h.semesterGpa,
      cgpa: h.cgpa,
    }));

    const totalAtt = attendances.length;
    const presentAtt = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const overallAttendanceRate = totalAtt > 0 ? parseFloat(((presentAtt / totalAtt) * 100).toFixed(1)) : 0;

    return {
      studentId: student.studentId,
      name: student.user?.fullNameEn || '',
      department: student.department?.nameEn,
      level: student.level,
      currentGpa: student.cgpa,
      totalCredits: student.totalCredits,
      academicWarnings: student.academicWarnings,
      gpaTrend,
      overallAttendanceRate,
      totalAttendances: totalAtt,
    };
  }

  async getCourseAnalytics(courseId: string): Promise<CourseAnalyticsResult> {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: ['department'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const totalGrades = await this.gradeRepo.find({
      where: { courseId, component: GradeComponent.TOTAL },
      relations: ['student', 'student.user'],
    });

    const registrations = await this.registrationRepo.find({
      where: { courseId, status: RegistrationStatus.APPROVED },
    });

    const totalStudents = registrations.length;
    const gradedStudents = totalGrades.length;
    const passed = totalGrades.filter((g) => g.score >= g.maxScore * 0.6).length;
    const failed = totalGrades.filter((g) => g.score < g.maxScore * 0.6).length;

    const marks = totalGrades.map((g) => g.score);
    const averageMarks = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
    const maxMarks = marks.length > 0 ? Math.max(...marks) : 0;
    const minMarks = marks.length > 0 ? Math.min(...marks) : 0;

    return {
      courseCode: course.code,
      courseName: course.nameEn,
      department: course.department?.nameEn,
      credits: course.credits,
      totalRegistered: totalStudents,
      totalGraded: gradedStudents,
      passed,
      failed,
      failureRate: gradedStudents > 0 ? parseFloat(((failed / gradedStudents) * 100).toFixed(2)) : 0,
      averageMarks: parseFloat(averageMarks.toFixed(2)),
      maxMarks,
      minMarks,
    };
  }

  async getDepartmentAnalytics(departmentId: string): Promise<Record<string, unknown>> {
    const department = await this.departmentRepo.findOne({ where: { id: departmentId } });
    if (!department) throw new NotFoundException('Department not found');

    const students = await this.studentRepo.find({ where: { departmentId }, relations: ['user'] });
    const courses = await this.courseRepo.find({ where: { departmentId, isActive: true } });
    const doctors = await this.doctorRepo.find({ where: { departmentId }, relations: ['user'] });

    const activeStudents = students.filter((s) => s.status === 'ACTIVE').length;
    const graduatedStudents = students.filter((s) => s.status === 'GRADUATED').length;
    const averageGpa = students.length > 0
      ? parseFloat((students.reduce((sum, s) => sum + Number(s.cgpa), 0) / students.length).toFixed(2))
      : 0;

    const courseIds = courses.map((c) => c.id);
    const allGrades = courseIds.length > 0
      ? await this.gradeRepo.find({
          where: { courseId: In(courseIds), component: GradeComponent.TOTAL },
        })
      : [];
    const gradesByCourseId = new Map<string, typeof allGrades>();
    for (const g of allGrades) {
      const list = gradesByCourseId.get(g.courseId) || [];
      list.push(g);
      gradesByCourseId.set(g.courseId, list);
    }

    const failureRates: { code: string; name: string; rate: number }[] = [];
    for (const course of courses) {
      const totalGrades = gradesByCourseId.get(course.id) || [];
      if (totalGrades.length >= 5) {
        const failed = totalGrades.filter((g) => g.score < g.maxScore * 0.6).length;
        failureRates.push({
          code: course.code,
          name: course.nameEn,
          rate: parseFloat(((failed / totalGrades.length) * 100).toFixed(2)),
        });
      }
    }

    return {
      departmentId: department.id,
      departmentName: department.nameEn,
      departmentCode: department.code,
      totalStudents: students.length,
      activeStudents,
      graduatedStudents,
      totalDoctors: doctors.length,
      totalCourses: courses.length,
      averageGpa,
      averageFailureRate: failureRates.length > 0
        ? parseFloat((failureRates.reduce((s, r) => s + r.rate, 0) / failureRates.length).toFixed(2))
        : 0,
      failureRates: failureRates.sort((a, b) => b.rate - a.rate),
    };
  }

  async getEnrollmentTrends(startDate?: string, endDate?: string): Promise<Record<string, unknown>> {
    const where: FindOptionsWhere<CourseRegistration> = { status: RegistrationStatus.APPROVED };
    if (startDate) where.registeredAt = MoreThanOrEqual(new Date(startDate));
    if (endDate) where.registeredAt = LessThanOrEqual(new Date(endDate));

    const registrations = await this.registrationRepo.find({
      where,
      relations: ['course', 'course.department', 'semester', 'semester.academicYear'],
      order: { registeredAt: 'ASC' },
    });

    const byPeriod = new Map<string, number>();
    for (const reg of registrations) {
      const sem = reg.semester;
      const key = sem ? `${sem.academicYear?.year || ''} ${sem.nameEn}` : 'Unknown';
      byPeriod.set(key, (byPeriod.get(key) || 0) + 1);
    }

    const trends = Array.from(byPeriod.entries()).map(([period, count]) => ({
      period,
      totalRegistrations: count,
    }));

    return {
      totalRegistrations: registrations.length,
      trends,
    };
  }

  async getGraduationStats(): Promise<Record<string, unknown>> {
    const graduated = await this.studentRepo.find({ where: { status: StudentStatus.GRADUATED } });
    const active = await this.studentRepo.find({ where: { status: StudentStatus.ACTIVE } });
    const totalStudents = graduated.length + active.length;

    const departments = await this.departmentRepo.find();
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const deptGraduated = graduated.filter((s) => s.departmentId === dept.id).length;
        const deptActive = active.filter((s) => s.departmentId === dept.id).length;
        const total = deptGraduated + deptActive;
        return {
          department: dept.nameEn,
          graduated: deptGraduated,
          active: deptActive,
          graduationRate: total > 0 ? parseFloat(((deptGraduated / total) * 100).toFixed(2)) : 0,
        };
      }),
    );

    return {
      totalGraduated: graduated.length,
      totalActive: active.length,
      graduationRate: totalStudents > 0
        ? parseFloat(((graduated.length / totalStudents) * 100).toFixed(2))
        : 0,
      byDepartment: deptStats,
    };
  }

  async getFailureRates(): Promise<Record<string, unknown>> {
    const courses = await this.courseRepo.find({ where: { isActive: true }, relations: ['department'] });

    const courseIds = courses.map((c) => c.id);
    const allGrades = courseIds.length > 0
      ? await this.gradeRepo.find({
          where: { courseId: In(courseIds), component: GradeComponent.TOTAL },
        })
      : [];
    const gradesByCourseId = new Map<string, typeof allGrades>();
    for (const g of allGrades) {
      const list = gradesByCourseId.get(g.courseId) || [];
      list.push(g);
      gradesByCourseId.set(g.courseId, list);
    }

    const results: FailureRateItem[] = [];
    for (const course of courses) {
      const totalGrades = gradesByCourseId.get(course.id) || [];
      if (totalGrades.length >= 10) {
        const failed = totalGrades.filter((g) => g.score < g.maxScore * 0.6).length;
        results.push({
          courseCode: course.code,
          courseName: course.nameEn,
          department: course.department?.nameEn,
          totalStudents: totalGrades.length,
          failedStudents: failed,
          failureRate: parseFloat(((failed / totalGrades.length) * 100).toFixed(2)),
          averageMarks: parseFloat(
            (totalGrades.reduce((s, g) => s + g.score, 0) / totalGrades.length).toFixed(2),
          ),
        });
      }
    }

    results.sort((a, b) => b.failureRate - a.failureRate);

    return {
      totalCoursesAnalyzed: results.length,
      overallAverageFailureRate: results.length > 0
        ? parseFloat((results.reduce((s, r) => s + r.failureRate, 0) / results.length).toFixed(2))
        : 0,
      highRiskCourses: results.filter((r) => r.failureRate > 30),
      courses: results,
    };
  }

  async getFacultyWorkload(): Promise<Record<string, unknown>> {
    const doctors = await this.doctorRepo.find({
      relations: ['user', 'department'],
    });

    const doctorIds = doctors.map((d) => d.id);
    const allGrades = doctorIds.length > 0
      ? await this.gradeRepo.find({ where: { gradedById: In(doctorIds) } })
      : [];
    const gradesByDoctorId = new Map<string, typeof allGrades>();
    for (const g of allGrades) {
      const list = gradesByDoctorId.get(g.gradedById) || [];
      list.push(g);
      gradesByDoctorId.set(g.gradedById, list);
    }

    const workload = doctors.map((doctor) => {
      const lectures = gradesByDoctorId.get(doctor.id) || [];
      const activeCourses = lectures.length;
      let workloadLevel = 'light';
      if (activeCourses >= 5) workloadLevel = 'heavy';
      else if (activeCourses >= 3) workloadLevel = 'moderate';

      return {
        doctorId: doctor.employeeId,
        name: doctor.user?.fullNameEn || '',
        department: doctor.department?.nameEn,
        title: doctor.title,
        activeCourses,
        workloadLevel,
      };
    });

    return {
      totalFaculty: workload.length,
      distribution: {
        heavy: workload.filter((w) => w.workloadLevel === 'heavy').length,
        moderate: workload.filter((w) => w.workloadLevel === 'moderate').length,
        light: workload.filter((w) => w.workloadLevel === 'light').length,
      },
      facultyWorkload: workload,
    };
  }
}
