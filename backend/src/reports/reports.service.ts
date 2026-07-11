import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseRegistration, RegistrationStatus } from '../database/entities/course-registration.entity';
import { Attendance } from '../database/entities/attendance.entity';
import { Grade, GradeComponent } from '../database/entities/grade.entity';
import { Student } from '../database/entities/student.entity';
import { Course } from '../database/entities/course.entity';
import { Department } from '../database/entities/department.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { Semester } from '../database/entities/semester.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(CourseRegistration)
    private readonly registrationRepo: Repository<CourseRegistration>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Semester)
    private readonly semesterRepo: Repository<Semester>,
  ) {}

  async getActiveRegistrationReport(): Promise<any> {
    const activeSemester = await this.semesterRepo.findOne({ where: { isActive: true } });
    if (!activeSemester) throw new NotFoundException('No active semester found');
    return this.getRegistrationReport(activeSemester.id);
  }

  async getRegistrationReport(semesterId: string): Promise<any> {
    const registrations = await this.registrationRepo.find({
      where: { semesterId, status: RegistrationStatus.APPROVED },
      relations: ['student', 'student.user', 'student.department', 'course'],
      order: { registeredAt: 'ASC' },
    });

    const byDepartment = new Map<string, { count: number; courses: Set<string> }>();
    for (const reg of registrations) {
      const deptName = reg.course?.department?.nameEn || reg.student?.department?.nameEn || 'Unknown';
      if (!byDepartment.has(deptName)) {
        byDepartment.set(deptName, { count: 0, courses: new Set() });
      }
      const data = byDepartment.get(deptName)!;
      data.count++;
      data.courses.add(reg.course?.code || '');
    }

    return {
      semesterId,
      totalRegistrations: registrations.length,
      uniqueStudents: new Set(registrations.map((r) => r.studentId)).size,
      uniqueCourses: new Set(registrations.map((r) => r.courseId)).size,
      byDepartment: Array.from(byDepartment.entries()).map(([dept, data]) => ({
        department: dept,
        registrations: data.count,
        uniqueCourses: data.courses.size,
      })),
    };
  }

  async getAttendanceReport(courseId: string): Promise<any> {
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['department'] });
    if (!course) throw new NotFoundException('Course not found');

    const attendances = await this.attendanceRepo.find({
      where: { courseId },
      relations: ['student', 'student.user', 'lecture'],
      order: { createdAt: 'ASC' },
    });

    const studentAttendance = new Map<string, { present: number; absent: number; late: number; total: number }>();
    for (const att of attendances) {
      const sid = att.studentId;
      if (!studentAttendance.has(sid)) {
        studentAttendance.set(sid, { present: 0, absent: 0, late: 0, total: 0 });
      }
      const data = studentAttendance.get(sid)!;
      data.total++;
      if (att.status === 'PRESENT') data.present++;
      else if (att.status === 'ABSENT') data.absent++;
      else if (att.status === 'LATE') data.late++;
    }

    return {
      courseCode: course.code,
      courseName: course.nameEn,
      department: course.department?.nameEn,
      totalLectures: new Set(attendances.map((a) => a.lectureId)).size,
      totalStudents: new Set(attendances.map((a) => a.studentId)).size,
      studentDetails: Array.from(studentAttendance.entries()).map(([sid, data]) => ({
        studentId: sid,
        present: data.present,
        absent: data.absent,
        late: data.late,
        total: data.total,
        attendanceRate: data.total > 0 ? parseFloat((((data.present + data.late) / data.total) * 100).toFixed(1)) : 0,
      })),
    };
  }

  async getGradeReport(courseId: string): Promise<any> {
    const course = await this.courseRepo.findOne({ where: { id: courseId }, relations: ['department'] });
    if (!course) throw new NotFoundException('Course not found');

    const totalGrades = await this.gradeRepo.find({
      where: { courseId, component: GradeComponent.TOTAL },
      relations: ['student', 'student.user', 'semester'],
      order: { score: 'DESC' },
    });

    const passed = totalGrades.filter((g) => g.score >= g.maxScore * 0.6);
    const failed = totalGrades.filter((g) => g.score < g.maxScore * 0.6);

    const marks = totalGrades.map((g) => g.score);
    const avg = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
    const sorted = [...marks].sort((a, b) => a - b);
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

    return {
      courseCode: course.code,
      courseName: course.nameEn,
      department: course.department?.nameEn,
      totalStudents: totalGrades.length,
      passed: passed.length,
      failed: failed.length,
      passRate: totalGrades.length > 0 ? parseFloat(((passed.length / totalGrades.length) * 100).toFixed(2)) : 0,
      failureRate: totalGrades.length > 0 ? parseFloat(((failed.length / totalGrades.length) * 100).toFixed(2)) : 0,
      averageMarks: parseFloat(avg.toFixed(2)),
      medianMarks: median,
      highestMarks: marks.length > 0 ? Math.max(...marks) : 0,
      lowestMarks: marks.length > 0 ? Math.min(...marks) : 0,
      studentResults: totalGrades.map((g) => ({
        studentId: g.student?.studentId,
        name: g.student?.user?.fullNameEn || '',
        score: g.score,
        maxScore: g.maxScore,
        percentage: g.maxScore > 0 ? parseFloat(((g.score / g.maxScore) * 100).toFixed(2)) : 0,
      })),
    };
  }

  async getDepartmentReport(departmentId: string): Promise<any> {
    const department = await this.departmentRepo.findOne({ where: { id: departmentId } });
    if (!department) throw new NotFoundException('Department not found');

    const students = await this.studentRepo.find({ where: { departmentId }, relations: ['user'] });
    const doctors = await this.doctorRepo.find({ where: { departmentId }, relations: ['user'] });
    const courses = await this.courseRepo.find({ where: { departmentId, isActive: true } });

    const avgGpa = students.length > 0
      ? parseFloat((students.reduce((sum, s) => sum + Number(s.cgpa), 0) / students.length).toFixed(2))
      : 0;

    const levelDistribution = new Map<number, number>();
    for (const s of students) {
      levelDistribution.set(s.level, (levelDistribution.get(s.level) || 0) + 1);
    }

    return {
      departmentId: department.id,
      departmentName: department.nameEn,
      departmentCode: department.code,
      totalStudents: students.length,
      totalDoctors: doctors.length,
      totalCourses: courses.length,
      averageGpa: avgGpa,
      studentsByLevel: Array.from(levelDistribution.entries()).map(([level, count]) => ({ level, count })),
      doctorList: doctors.map((d) => ({
        employeeId: d.employeeId,
        name: d.user?.fullNameEn || '',
        title: d.title,
      })),
    };
  }

  async exportReport(type: string, format: 'csv' | 'pdf'): Promise<{ filename: string; content: string }> {
    switch (type) {
      case 'registration':
        return this.exportRegistrationReport(format);
      case 'attendance':
        return this.exportAttendanceReport(format);
      case 'grades':
        return this.exportGradeReport(format);
      default:
        throw new NotFoundException(`Report type ${type} not found`);
    }
  }

  private async exportRegistrationReport(format: 'csv' | 'pdf'): Promise<{ filename: string; content: string }> {
    const registrations = await this.registrationRepo.find({
      where: { status: RegistrationStatus.APPROVED },
      relations: ['student', 'student.user', 'course'],
      take: 1000,
    });

    if (format === 'csv') {
      const header = 'Student ID,Student Name,Course Code,Course Name,Status,Credits,Date\n';
      const rows = registrations.map((r) =>
        [
          r.student?.studentId,
          r.student?.user?.fullNameEn || '',
          r.course?.code,
          r.course?.nameEn,
          r.status,
          r.credits,
          r.registeredAt.toISOString().split('T')[0],
        ].join(','),
      );
      return { filename: 'registration-report.csv', content: header + rows.join('\n') };
    }

    const html = this.generateHtmlTable('Registration Report',
      ['Student ID', 'Student Name', 'Course Code', 'Course'],
      registrations.map((r) => [
        r.student?.studentId || '',
        r.student?.user?.fullNameEn || '',
        r.course?.code || '',
        r.course?.nameEn || '',
      ]),
    );
    return { filename: 'registration-report.html', content: html };
  }

  private async exportAttendanceReport(format: 'csv' | 'pdf'): Promise<{ filename: string; content: string }> {
    const attendances = await this.attendanceRepo.find({
      relations: ['student', 'student.user', 'course'],
      take: 1000,
    });

    if (format === 'csv') {
      const header = 'Student ID,Student Name,Course Code,Status,Date,Method\n';
      const rows = attendances.map((a) =>
        [
          a.student?.studentId,
          a.student?.user?.fullNameEn || '',
          a.course?.code,
          a.status,
          a.date.toISOString().split('T')[0],
          a.method,
        ].join(','),
      );
      return { filename: 'attendance-report.csv', content: header + rows.join('\n') };
    }

    const html = this.generateHtmlTable('Attendance Report',
      ['Student ID', 'Student Name', 'Course', 'Status', 'Date'],
      attendances.map((a) => [
        a.student?.studentId || '',
        a.student?.user?.fullNameEn || '',
        a.course?.code || '',
        a.status,
        a.date.toISOString().split('T')[0],
      ]),
    );
    return { filename: 'attendance-report.html', content: html };
  }

  private async exportGradeReport(format: 'csv' | 'pdf'): Promise<{ filename: string; content: string }> {
    const totalGrades = await this.gradeRepo.find({
      where: { component: GradeComponent.TOTAL },
      relations: ['student', 'student.user', 'course'],
      take: 1000,
    });

    if (format === 'csv') {
      const header = 'Student ID,Student Name,Course Code,Score,Max Score,Percentage\n';
      const rows = totalGrades.map((g) =>
        [
          g.student?.studentId,
          g.student?.user?.fullNameEn || '',
          g.course?.code,
          g.score,
          g.maxScore,
          g.maxScore > 0 ? ((g.score / g.maxScore) * 100).toFixed(1) : '0',
        ].join(','),
      );
      return { filename: 'grade-report.csv', content: header + rows.join('\n') };
    }

    const html = this.generateHtmlTable('Grade Report',
      ['Student ID', 'Student Name', 'Course', 'Score', 'Max', 'Percentage'],
      totalGrades.map((g) => [
        g.student?.studentId || '',
        g.student?.user?.fullNameEn || '',
        g.course?.code || '',
        g.score.toString(),
        g.maxScore.toString(),
        g.maxScore > 0 ? ((g.score / g.maxScore) * 100).toFixed(1) + '%' : '0%',
      ]),
    );
    return { filename: 'grade-report.html', content: html };
  }

  private generateHtmlTable(title: string, headers: string[], rows: string[][]): string {
    const headerRow = headers.map((h) => `<th>${this.escapeHtml(h)}</th>`).join('');
    const dataRows = rows.map((row) => `<tr>${row.map((c) => `<td>${this.escapeHtml(c)}</td>`).join('')}</tr>`).join('\n');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${this.escapeHtml(title)}</title>
<style>
body{font-family:Arial,sans-serif;margin:20px}
h1{color:#1a5276}
table{width:100%;border-collapse:collapse;margin:20px 0}
th{background:#1a5276;color:white;padding:10px;text-align:left}
td{border:1px solid #ddd;padding:8px}
tr:nth-child(even){background:#f5f5f5}
.footer{margin-top:20px;font-size:12px;color:#666;text-align:center}
</style></head><body>
<h1>${this.escapeHtml(title)}</h1>
<p>Generated on: ${this.escapeHtml(new Date().toLocaleDateString())}</p>
<table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table>
<div class="footer">FEE-MENOUF University - Faculty of Engineering, Menoufia University</div>
</body></html>`;
  }

  private escapeHtml(str: string): string {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
