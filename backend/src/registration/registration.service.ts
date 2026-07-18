import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CourseRegistration, RegistrationStatus, Student, Course } from '../database/entities';
import { UserRole } from '../database/entities/user.entity';
import { RegisterCourseDto } from './dto/register-course.dto';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);
  private readonly MAX_CREDITS = 21;
  private readonly MIN_CREDITS = 12;

  constructor(
    @InjectRepository(CourseRegistration)
    private readonly regRepo: Repository<CourseRegistration>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async register(dto: RegisterCourseDto, userId: string) {
    const student = await this.studentRepo.findOne({
      where: { userId },
      relations: ['registrations', 'registrations.course'],
    });
    if (!student) throw new NotFoundException('Student profile not found for this user');

    const courses = await this.courseRepo.find({
      where: { id: In(dto.courseIds), isActive: true },
      relations: ['prerequisites', 'lectures'],
    });

    if (courses.length !== dto.courseIds.length) {
      const foundIds = courses.map((c) => c.id);
      const missing = dto.courseIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Courses not found or inactive: ${missing.join(', ')}`);
    }

    const errors: string[] = [];
    let totalCredits = 0;

    for (const course of courses) {
      totalCredits += course.credits;
    }

    if (totalCredits > this.MAX_CREDITS) {
      errors.push(`Total credits (${totalCredits}) exceed maximum (${this.MAX_CREDITS})`);
    }
    if (totalCredits < this.MIN_CREDITS && courses.length > 0) {
      errors.push(`Total credits (${totalCredits}) are below minimum (${this.MIN_CREDITS})`);
    }

    for (const course of courses) {
      if (course.prerequisites && course.prerequisites.length > 0) {
        const completedCourseIds = (student.registrations || [])
          .filter((r) => r.status === RegistrationStatus.APPROVED)
          .map((r) => r.courseId);

        const missingPrereqs = course.prerequisites.filter((p) => !completedCourseIds.includes(p.id));
        if (missingPrereqs.length > 0) {
          errors.push(`Course ${course.code}: Missing prerequisites: ${missingPrereqs.map((p) => p.code).join(', ')}`);
        }
      }

      if (course.maxStudents > 0) {
        const enrolledCount = await this.regRepo.count({
          where: { courseId: course.id, status: RegistrationStatus.APPROVED },
        });
        if (enrolledCount >= course.maxStudents) {
          errors.push(`Course ${course.code}: Maximum capacity (${course.maxStudents}) reached`);
        }
      }

      const alreadyRegistered = student.registrations?.find(
        (r) => r.courseId === course.id && r.status !== RegistrationStatus.DROPPED,
      );
      if (alreadyRegistered) {
        errors.push(`Course ${course.code}: Already registered`);
      }

      for (const otherCourse of courses) {
        if (otherCourse.id === course.id) continue;
        for (const myLec of course.lectures || []) {
          for (const otherLec of otherCourse.lectures || []) {
            if (myLec.dayOfWeek === otherLec.dayOfWeek &&
                myLec.startTime < otherLec.endTime &&
                otherLec.startTime < myLec.endTime) {
              errors.push(
                `Schedule conflict: ${course.code} ${myLec.startTime}-${myLec.endTime} conflicts with ${otherCourse.code} ${otherLec.startTime}-${otherLec.endTime}`,
              );
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }

    const registrations = courses.map((course) =>
      this.regRepo.create({
        studentId: student.id,
        courseId: course.id,
        semesterId: dto.semesterId,
        status: RegistrationStatus.PENDING,
        credits: course.credits,
      }),
    );

    const saved = await this.regRepo.save(registrations);

    this.logger.log(`Course registration submitted for student ${student.id}: ${courses.length} courses, ${totalCredits} credits`);

    return {
      message: 'Registration submitted. Pending approval.',
      registrations: saved.map((r) => ({ id: r.id, courseId: r.courseId, status: r.status, credits: r.credits })),
      totalCredits,
    };
  }

  async dropRegistration(id: string, currentUser: { id: string; role: UserRole }) {
    const reg = await this.regRepo.findOne({ where: { id }, relations: ['course', 'student'] });
    if (!reg) throw new NotFoundException('Registration not found');

    if (currentUser.role === UserRole.STUDENT) {
      if (!reg.student || reg.student.userId !== currentUser.id) {
        throw new ForbiddenException('You can only drop your own registrations');
      }
    }

    if (reg.status === RegistrationStatus.DROPPED) {
      throw new BadRequestException('Already dropped');
    }
    reg.status = RegistrationStatus.DROPPED;
    return this.regRepo.save(reg);
  }

  async getStudentRegistrations(studentId: string) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.regRepo.find({
      where: { studentId },
      relations: ['course', 'course.doctor', 'course.doctor.user', 'semester'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingRegistrations() {
    return this.regRepo.find({
      where: { status: RegistrationStatus.PENDING },
      relations: ['student', 'student.user', 'course', 'semester'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveRegistration(id: string) {
    const reg = await this.regRepo.findOne({
      where: { id },
      relations: ['course', 'student'],
    });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException(`Registration is already ${reg.status}`);
    }

    reg.status = RegistrationStatus.APPROVED;
    reg.approvedAt = new Date();
    await this.regRepo.save(reg);

    this.logger.log(`Registration ${id} approved for course ${reg.courseId}`);

    return reg;
  }

  async rejectRegistration(id: string, reason: string) {
    const reg = await this.regRepo.findOne({ where: { id } });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException(`Registration is already ${reg.status}`);
    }
    reg.status = RegistrationStatus.REJECTED;
    await this.regRepo.save(reg);

    this.logger.log(`Registration ${id} rejected: ${reason}`);

    return reg;
  }
}
