import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Student, StudentStatus } from '../database/entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { paginate, PaginatedResult, getPaginationParams, getSkipTake } from '../common/utils/pagination';

interface FindStudentsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  departmentId?: string;
  level?: string;
  status?: StudentStatus;
  search?: string;
  [key: string]: unknown;
}

const ALLOWED_SORT_COLUMNS = ['createdAt', 'studentId', 'level', 'status', 'gpa'];

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(dto: CreateStudentDto, userId: string): Promise<Student> {
    const student = this.studentRepository.create({
      ...dto,
      userId: dto.userId,
      enrollmentDate: new Date(),
    });
    return this.studentRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    const { Grade } = await import('../database/entities/grade.entity');
    const { Attendance } = await import('../database/entities/attendance.entity');
    const { CourseRegistration } = await import('../database/entities/course-registration.entity');
    const { GpaHistory } = await import('../database/entities/gpa-history.entity');
    const mgr = this.studentRepository.manager;
    await mgr.delete(Grade, { studentId: student.id });
    await mgr.delete(Attendance, { studentId: student.id });
    await mgr.delete(CourseRegistration, { studentId: student.id });
    await mgr.delete(GpaHistory, { studentId: student.id });
    const { User } = await import('../database/entities/user.entity');
    const userRepo = mgr.getRepository(User);
    await this.studentRepository.remove(student);
    await userRepo.delete(student.userId);
  }

  async findAll(query: FindStudentsQuery): Promise<PaginatedResult<Student>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);
    const where: FindOptionsWhere<Student> = {};
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.level) where.level = parseInt(query.level, 10);
    if (query.status) where.status = query.status;
    if (query.search) {
      const search = `%${query.search}%`;
      const [data, total] = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('student.department', 'department')
        .leftJoinAndSelect('student.program', 'program')
        .where('user.full_name_ar ILIKE :search OR user.full_name_en ILIKE :search OR student.student_id ILIKE :search', { search })
        .skip(skip).take(take)
        .orderBy('student.created_at', 'DESC')
        .getManyAndCount();
      return paginate(data, total, params);
    }
    const [data, total] = await this.studentRepository.findAndCount({
      where, skip, take,
      relations: { user: true, department: true, program: true },
      order: { [ALLOWED_SORT_COLUMNS.includes(params.sortBy || '') ? (params.sortBy || 'createdAt') : 'createdAt']: params.sortOrder || 'DESC' },
    });
    return paginate(data, total, params);
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: { user: true, department: true, program: true, academicYear: true, semester: true, registrations: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async findByStudentId(studentId: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { studentId },
      relations: { user: true, department: true, program: true },
    });
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    Object.assign(student, dto);
    return this.studentRepository.save(student);
  }

  async getGrades(studentId: string) {
    const student = await this.findOne(studentId);
    const { Grade } = await import('../database/entities/grade.entity');
    const gradesRepo = this.studentRepository.manager.getRepository(Grade);
    return gradesRepo.find({
      where: { studentId: student.id },
      relations: { course: true, semester: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAttendance(studentId: string) {
    const student = await this.findOne(studentId);
    const { Attendance } = await import('../database/entities/attendance.entity');
    const attendanceRepo = this.studentRepository.manager.getRepository(Attendance);
    return attendanceRepo.find({
      where: { studentId: student.id },
      relations: { course: true, lecture: true },
      order: { date: 'DESC' },
    });
  }

  async getRegistrations(studentId: string) {
    const student = await this.findOne(studentId);
    const { CourseRegistration } = await import('../database/entities/course-registration.entity');
    const regRepo = this.studentRepository.manager.getRepository(CourseRegistration);
    return regRepo.find({
      where: { studentId: student.id },
      relations: { course: true, semester: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateGpa(id: string): Promise<Student> {
    const student = await this.findOne(id);
    const { Grade, GradeComponent } = await import('../database/entities/grade.entity');
    const gradesRepo = this.studentRepository.manager.getRepository(Grade);
    const totalGrade = await gradesRepo.findOne({
      where: { studentId: student.id, component: GradeComponent.TOTAL, isPublished: true },
    });
    if (totalGrade) {
      student.gpa = parseFloat((totalGrade.score / totalGrade.maxScore * 4).toFixed(2));
    }
    return this.studentRepository.save(student);
  }
}
