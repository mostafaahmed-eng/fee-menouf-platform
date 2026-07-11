import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Doctor, RegistrationStatus } from '../database/entities';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorFilterDto } from './dto/doctor-filter.dto';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async create(dto: CreateDoctorDto): Promise<Doctor> {
    const existing = await this.doctorRepo.findOne({ where: { employeeId: dto.employeeId } });
    if (existing) throw new BadRequestException('Employee ID already exists');
    const doctor = this.doctorRepo.create(dto);
    return this.doctorRepo.save(doctor);
  }

  async findAll(filter?: DoctorFilterDto): Promise<Doctor[]> {
    const where: any = {};
    if (filter?.departmentId) where.departmentId = filter.departmentId;
    if (filter?.title) where.title = filter.title;
    if (filter?.search) {
      return this.doctorRepo.find({
        relations: ['user', 'department'],
        where: [
          { ...where, employeeId: Like(`%${filter.search}%`) },
          { ...where, user: { fullNameAr: Like(`%${filter.search}%`) } },
          { ...where, user: { fullNameEn: Like(`%${filter.search}%`) } },
        ],
      });
    }
    return this.doctorRepo.find({ where, relations: ['user', 'department'] });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: ['user', 'department', 'courses'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findOne({
      where: { userId },
      relations: ['user', 'department'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, dto);
    return this.doctorRepo.save(doctor);
  }

  async remove(id: string): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorRepo.remove(doctor);
  }

  async getDashboard(id: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: [
        'user', 'department', 'courses',
        'courses.registrations', 'courses.registrations.student',
        'courses.lectures', 'courses.attendance',
      ],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const courses = doctor.courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.nameEn,
      credits: c.credits,
      enrolledCount: c.registrations?.filter((r) => r.status === RegistrationStatus.APPROVED).length || 0,
      maxStudents: c.maxStudents,
    }));

    const totalStudents = courses.reduce((sum, c) => sum + c.enrolledCount, 0);

    const upcomingLectures = [];
    const attendanceSummaries = [];
    for (const course of doctor.courses) {
      const totalAtt = course.attendance?.length || 0;
      const presentAtt = course.attendance?.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
      attendanceSummaries.push({
        courseName: course.nameEn,
        averageAttendance: totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0,
        totalLectures: totalAtt,
      });

      for (const lec of course.lectures || []) {
        upcomingLectures.push({
          id: lec.id,
          courseName: course.nameEn,
          startTime: lec.startTime,
          endTime: lec.endTime,
          room: lec.room,
          group: lec.group,
        });
      }
    }

    return {
      courses,
      totalStudents,
      upcomingLectures: upcomingLectures.slice(0, 10),
      attendanceSummaries,
    };
  }

  async getCourseStudents(doctorId: string, courseId: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
      relations: ['courses', 'courses.registrations', 'courses.registrations.student', 'courses.registrations.student.user'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const course = doctor.courses.find((c) => c.id === courseId);
    if (!course) throw new NotFoundException('Course not found for this doctor');

    const approvedRegs = course.registrations?.filter((r) => r.status === RegistrationStatus.APPROVED) || [];
    return approvedRegs.map((reg) => ({
      id: reg.student.id,
      studentId: reg.student.studentId,
      name: reg.student.user.fullNameEn,
      email: reg.student.user.email,
      gpa: Number(reg.student.gpa),
      level: reg.student.level,
    }));
  }

  async getCourseAnalytics(doctorId: string, courseId: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
      relations: [
        'courses', 'courses.registrations', 'courses.registrations.student',
        'courses.attendance', 'courses.attendance.student',
        'courses.grades', 'courses.grades.student',
      ],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    const course = doctor.courses.find((c) => c.id === courseId);
    if (!course) throw new NotFoundException('Course not found for this doctor');

    const approvedStudents = course.registrations?.filter((r) => r.status === RegistrationStatus.APPROVED) || [];

    const gradesByStudent = new Map<string, any[]>();
    for (const grade of course.grades || []) {
      if (!gradesByStudent.has(grade.studentId)) gradesByStudent.set(grade.studentId, []);
      gradesByStudent.get(grade.studentId)!.push(grade);
    }

    const studentGrades = [];
    for (const reg of approvedStudents) {
      const components = gradesByStudent.get(reg.student.id) || [];
      const totalComponent = components.find((g) => g.component === 'TOTAL');
      studentGrades.push({
        studentId: reg.student.studentId,
        name: reg.student.user?.fullNameEn || '',
        totalScore: totalComponent ? Number(totalComponent.score) : null,
        components: components.map((g) => ({ component: g.component, score: Number(g.score), maxScore: Number(g.maxScore) })),
      });
    }

    const totalAtt = course.attendance?.length || 0;
    const presentAtt = course.attendance?.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;

    return {
      courseCode: course.code,
      courseName: course.nameEn,
      totalStudents: approvedStudents.length,
      maxStudents: course.maxStudents,
      averageAttendance: totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0,
      studentGrades,
    };
  }
}
