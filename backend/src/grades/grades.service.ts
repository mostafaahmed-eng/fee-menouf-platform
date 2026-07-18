import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade, GradeComponent, Student, Course } from '../database/entities';
import { CreateGradeDto } from './dto/create-grade.dto';
import { BulkGradeDto } from './dto/bulk-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateGradeDto): Promise<Grade> {
    const student = await this.studentRepo.findOne({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.gradeRepo.findOne({
      where: { studentId: dto.studentId, courseId: dto.courseId, component: dto.component },
    });
    if (existing) throw new BadRequestException(`Grade component ${dto.component} already exists for this student/course`);

    const grade = this.gradeRepo.create({ ...dto, gradedAt: new Date() });
    const saved = await this.gradeRepo.save(grade);

    this.logger.log(`Grade created: student ${dto.studentId}, course ${dto.courseId}, component ${dto.component}`);

    return saved;
  }

  async createBulk(dto: BulkGradeDto): Promise<Grade[]> {
    const results: Grade[] = [];
    const errors: string[] = [];
    for (const gradeDto of dto.grades) {
      try {
        results.push(await this.create(gradeDto));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        this.logger.warn(`Bulk grade failed for student ${gradeDto.studentId}/${gradeDto.component}: ${message}`);
        errors.push(`Student ${gradeDto.studentId}/${gradeDto.component}: ${message}`);
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException(`Bulk entry completed with errors: ${errors.join('; ')}`);
    }
    return results;
  }

  async update(id: string, dto: UpdateGradeDto): Promise<Grade> {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');
    if (grade.isPublished) throw new BadRequestException('Cannot update published grade');
    if (dto.studentId !== undefined) grade.studentId = dto.studentId;
    if (dto.courseId !== undefined) grade.courseId = dto.courseId;
    if (dto.semesterId !== undefined) grade.semesterId = dto.semesterId;
    if (dto.component !== undefined) grade.component = dto.component;
    if (dto.score !== undefined) grade.score = dto.score;
    if (dto.maxScore !== undefined) grade.maxScore = dto.maxScore;
    if (dto.weight !== undefined) grade.weight = dto.weight;
    if (dto.remarks !== undefined) grade.remarks = dto.remarks;
    const saved = await this.gradeRepo.save(grade);

    this.logger.log(`Grade ${id} updated`);

    return saved;
  }

  async getStudentGrades(studentId: string) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.gradeRepo.find({
      where: { studentId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCourseGrades(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.gradeRepo.find({
      where: { courseId, isPublished: true },
      relations: ['student', 'student.user'],
      order: { gradedAt: 'DESC' },
    });
  }

  async publishGrades(courseId: string) {
    const grades = await this.gradeRepo.find({
      where: { courseId, isPublished: false },
      relations: ['student', 'course'],
    });

    if (grades.length === 0) {
      throw new BadRequestException('No unpublished grades found');
    }

    for (const grade of grades) {
      grade.isPublished = true;
      grade.gradedAt = new Date();
    }

    const saved = await this.gradeRepo.save(grades);

    this.logger.log(`Grades published for course ${courseId}: ${grades.length} grades`);

    return saved;
  }

  async getStudentTranscript(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
      relations: ['user', 'department'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const grades = await this.gradeRepo.find({
      where: { studentId, isPublished: true },
      relations: ['course'],
      order: { gradedAt: 'ASC' },
    });

    const courseMap = new Map<string, { code: string; name: string; credits: number; components: { component: GradeComponent; score: number; maxScore: number; weight: number }[]; totalScore: number | null }>();
    for (const g of grades) {
      const key = g.courseId;
      if (!courseMap.has(key)) {
        courseMap.set(key, {
          code: g.course.code,
          name: g.course.nameEn,
          credits: g.course.credits,
          components: [],
          totalScore: null,
        });
      }
      const entry = courseMap.get(key)!;
      entry.components.push({
        component: g.component,
        score: Number(g.score),
        maxScore: Number(g.maxScore),
        weight: Number(g.weight),
      });
      if (g.component === GradeComponent.TOTAL) {
        entry.totalScore = Number(g.score);
      }
    }

    const courses = Array.from(courseMap.values());
    return {
      studentId: student.studentId,
      studentName: student.user.fullNameEn,
      department: student.department?.nameEn || 'N/A',
      cgpa: Number(student.cgpa),
      totalCredits: student.totalCredits || 0,
      courses,
    };
  }
}
