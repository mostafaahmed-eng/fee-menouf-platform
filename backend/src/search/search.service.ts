import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Student } from '../database/entities/student.entity';
import { Course } from '../database/entities/course.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { User } from '../database/entities/user.entity';

export interface StudentSearchResult {
  id: string; studentId: string; name: string; email: string | undefined;
  department: string | undefined; level: number; gpa: number | null; status: string;
}

export interface CourseSearchResult {
  id: string; code: string; name: string; department: string | undefined;
  credits: number; capacity: number;
}

export interface DoctorSearchResult {
  id: string; employeeId: string; name: string; email: string | undefined;
  department: string | undefined; title: string | undefined; specialization: string | undefined;
}

interface AdvancedSearchParams {
  query?: string;
  departmentId?: string;
  academicYear?: string;
  level?: number;
  minCredits?: number;
  maxCredits?: number;
  type?: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async search(
    query: string,
    type?: 'students' | 'courses' | 'doctors' | 'all',
  ): Promise<{ students?: StudentSearchResult[]; courses?: CourseSearchResult[]; doctors?: DoctorSearchResult[] }> {
    const result: { students?: StudentSearchResult[]; courses?: CourseSearchResult[]; doctors?: DoctorSearchResult[] } = {};

    if (!type || type === 'students' || type === 'all') {
      result.students = await this.searchStudents(query);
    }
    if (!type || type === 'courses' || type === 'all') {
      result.courses = await this.searchCourses(query);
    }
    if (!type || type === 'doctors' || type === 'all') {
      result.doctors = await this.searchDoctors(query);
    }

    return result;
  }

  async advancedSearch(params: AdvancedSearchParams): Promise<{ students?: StudentSearchResult[]; courses?: CourseSearchResult[] }> {
    const result: { students?: StudentSearchResult[]; courses?: CourseSearchResult[] } = {};
    const searchQuery = params.query ? `%${params.query}%` : '%';

    if (!params.type || params.type === 'students') {
      result.students = await this.advancedStudentSearch(searchQuery, params);
    }
    if (!params.type || params.type === 'courses') {
      result.courses = await this.advancedCourseSearch(searchQuery, params);
    }

    return result;
  }

  private async searchStudents(query: string): Promise<StudentSearchResult[]> {
    const pattern = `%${query}%`;

    const byStudentId = await this.studentRepo.find({
      where: { studentId: ILike(pattern) },
      relations: ['user', 'department'],
      take: 20,
    });

    const users = await this.userRepo.find({
      where: [
        { fullNameEn: ILike(pattern) },
        { fullNameAr: ILike(pattern) },
        { email: ILike(pattern) },
      ],
      take: 20,
    });

    const byUser = await this.studentRepo.find({
      where: users.map((u) => ({ userId: u.id })),
      relations: ['user', 'department'],
      take: 20,
    });

    const merged = new Map<string, StudentSearchResult>();
    for (const s of [...byStudentId, ...byUser]) {
      if (!merged.has(s.id)) {
        merged.set(s.id, {
          id: s.id,
          studentId: s.studentId,
          name: s.user?.fullNameEn || '',
          email: s.user?.email,
          department: s.department?.nameEn,
          level: s.level,
          gpa: s.cgpa,
          status: s.status,
        });
      }
    }

    return Array.from(merged.values()).slice(0, 20);
  }

  private async searchCourses(query: string): Promise<CourseSearchResult[]> {
    const pattern = `%${query}%`;
    const courses = await this.courseRepo.find({
      where: [
        { code: ILike(pattern) },
        { nameEn: ILike(pattern) },
        { nameAr: ILike(pattern) },
      ],
      relations: ['department'],
      take: 20,
    });

    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.nameEn,
      department: c.department?.nameEn,
      credits: c.credits,
      capacity: c.capacity,
    }));
  }

  private async searchDoctors(query: string): Promise<DoctorSearchResult[]> {
    const pattern = `%${query}%`;

    const byEmployeeId = await this.doctorRepo.find({
      where: { employeeId: ILike(pattern) },
      relations: ['user', 'department'],
      take: 20,
    });

    const users = await this.userRepo.find({
      where: [
        { fullNameEn: ILike(pattern) },
        { fullNameAr: ILike(pattern) },
        { email: ILike(pattern) },
      ],
      take: 20,
    });

    const byUser = await this.doctorRepo.find({
      where: users.map((u) => ({ userId: u.id })),
      relations: ['user', 'department'],
      take: 20,
    });

    const merged = new Map<string, DoctorSearchResult>();
    for (const d of [...byEmployeeId, ...byUser]) {
      if (!merged.has(d.id)) {
        merged.set(d.id, {
          id: d.id,
          employeeId: d.employeeId,
          name: d.user?.fullNameEn || '',
          email: d.user?.email,
          department: d.department?.nameEn,
          title: d.title,
          specialization: d.specialization,
        });
      }
    }

    return Array.from(merged.values()).slice(0, 20);
  }

  private async advancedStudentSearch(searchQuery: string, params: AdvancedSearchParams): Promise<StudentSearchResult[]> {
    const qb = this.studentRepo.createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.department', 'department')
      .where(
        '(student.studentId ILIKE :q OR user.fullNameEn ILIKE :q OR user.fullNameAr ILIKE :q)',
        { q: searchQuery },
      );

    if (params.departmentId) {
      qb.andWhere('student.departmentId = :deptId', { deptId: params.departmentId });
    }
    if (params.level) {
      qb.andWhere('student.level = :level', { level: params.level });
    }

    const students = await qb.take(50).getMany();
    return students.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      name: s.user?.fullNameEn || '',
      email: s.user?.email,
      department: s.department?.nameEn,
      level: s.level,
      gpa: s.cgpa,
      status: s.status,
    }));
  }

  private async advancedCourseSearch(searchQuery: string, params: AdvancedSearchParams): Promise<CourseSearchResult[]> {
    const qb = this.courseRepo.createQueryBuilder('course')
      .leftJoinAndSelect('course.department', 'department')
      .where(
        '(course.code ILIKE :q OR course.nameEn ILIKE :q OR course.nameAr ILIKE :q)',
        { q: searchQuery },
      );

    if (params.departmentId) {
      qb.andWhere('course.departmentId = :deptId', { deptId: params.departmentId });
    }

    const courses = await qb.take(50).getMany();
    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.nameEn,
      department: c.department?.nameEn,
      credits: c.credits,
      capacity: c.capacity,
    }));
  }
}
