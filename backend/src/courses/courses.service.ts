import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Course, CourseMaterial, Announcement, RegistrationStatus, Doctor } from '../database/entities';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { UploadMaterialDto } from './dto/upload-material.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private getCached(key: string): any | null {
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) return item.data;
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, expiry: Date.now() + this.CACHE_TTL });
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(pattern)) this.cache.delete(key);
      }
    } else {
      this.cache.clear();
    }
  }

  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseMaterial)
    private readonly materialRepo: Repository<CourseMaterial>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  async create(dto: CreateCourseDto): Promise<Course> {
    const existing = await this.courseRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Course code already exists');

    const { prerequisiteIds, ...courseData } = dto;
    const course = this.courseRepo.create(courseData);

    if (prerequisiteIds && prerequisiteIds.length > 0) {
      const prerequisites = await this.courseRepo.findByIds(prerequisiteIds);
      if (prerequisites.length !== prerequisiteIds.length) {
        throw new BadRequestException('One or more prerequisites not found');
      }
      course.prerequisites = prerequisites;
    }

    this.clearCache('courses_findAll');
    return this.courseRepo.save(course);
  }

  async findAll(filter?: CourseFilterDto): Promise<Course[]> {
    const cacheKey = `courses_findAll_${JSON.stringify(filter || {})}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const where: FindOptionsWhere<Course> = {};
    if (filter?.departmentId) where.departmentId = filter.departmentId;
    if (filter?.programId) where.programId = filter.programId;
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    let result: Course[];
    if (filter?.search) {
      result = await this.courseRepo.find({
        relations: ['department', 'doctor', 'doctor.user'],
        where: [
          { ...where, code: Like(`%${filter.search}%`) },
          { ...where, nameEn: Like(`%${filter.search}%`) },
        ],
      });
    } else {
      result = await this.courseRepo.find({ where, relations: ['department', 'doctor', 'doctor.user'] });
    }
    this.setCache(cacheKey, result);
    return result;
  }

  async findOne(id: string): Promise<Course> {
    const cacheKey = `courses_findOne_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['department', 'doctor', 'doctor.user', 'prerequisites', 'program'],
    });
    if (!course) throw new NotFoundException('Course not found');
    this.setCache(cacheKey, course);
    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    const { prerequisiteIds, ...courseData } = dto;
    Object.assign(course, courseData);
    if (prerequisiteIds !== undefined) {
      course.prerequisites = await this.courseRepo.findByIds(prerequisiteIds);
    }
    this.clearCache(`courses_findOne_${id}`);
    this.clearCache(`courses_students_${id}`);
    this.clearCache(`courses_schedule_${id}`);
    this.clearCache('courses_findAll');
    return this.courseRepo.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    this.clearCache();
    await this.courseRepo.remove(course);
  }

  async getPrerequisites(id: string) {
    const cacheKey = `courses_prerequisites_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['prerequisites', 'prerequisites.department'],
    });
    if (!course) throw new NotFoundException('Course not found');
    const result = (course.prerequisites || []).map((p) => ({
      id: p.id,
      code: p.code,
      name: p.nameEn,
      credits: p.credits,
    }));
    this.setCache(cacheKey, result);
    return result;
  }

  async getStudents(id: string) {
    const cacheKey = `courses_students_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['registrations', 'registrations.student', 'registrations.student.user'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const approvedRegs = course.registrations?.filter((r) => r.status === RegistrationStatus.APPROVED) || [];
    const result = approvedRegs.map((reg) => ({
      id: reg.student.id,
      studentId: reg.student.studentId,
      name: reg.student.user.fullNameEn,
      email: reg.student.user.email,
      gpa: Number(reg.student.gpa),
      level: reg.student.level,
    }));
    this.setCache(cacheKey, result);
    return result;
  }

  async getSchedule(id: string) {
    const cacheKey = `courses_schedule_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['lectures'],
    });
    if (!course) throw new NotFoundException('Course not found');

    const result = (course.lectures || []).map((l) => ({
      id: l.id,
      dayOfWeek: l.dayOfWeek,
      startTime: l.startTime,
      endTime: l.endTime,
      type: l.type,
      room: l.room,
      group: l.group,
    }));
    this.setCache(cacheKey, result);
    return result;
  }

  async uploadMaterial(courseId: string, dto: UploadMaterialDto, userId: string, file?: Express.Multer.File): Promise<CourseMaterial> {
    await this.findOne(courseId);
    let url = dto.url || '';
    if (file) {
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      const uploadDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, uniqueName), file.buffer);
      url = `/uploads/${uniqueName}`;
    }
    const doctor = await this.materialRepo.manager.findOne(Doctor, { where: { userId } });
    const payload: any = { ...dto, courseId, uploadedById: doctor?.id || null, url };
    if (payload.url === undefined) payload.url = '';
    const material = this.materialRepo.create(payload);
    this.clearCache(`courses_materials_${courseId}`);
    const saved = await this.materialRepo.save(material);
    return saved as unknown as CourseMaterial;
  }

  async getMaterials(courseId: string): Promise<CourseMaterial[]> {
    const cacheKey = `courses_materials_${courseId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    await this.findOne(courseId);
    const result = await this.materialRepo.find({
      where: { courseId, isPublished: true },
      order: { uploadedAt: 'DESC' },
    });
    this.setCache(cacheKey, result);
    return result;
  }

  async createAnnouncement(courseId: string, dto: CreateAnnouncementDto, userId: string): Promise<Announcement> {
    await this.findOne(courseId);
    const doctor = await this.announcementRepo.manager.findOne(Doctor, { where: { userId } });
    if (!doctor) throw new BadRequestException('Doctor profile not found for current user');
    const announcement = this.announcementRepo.create({
      ...dto,
      courseId,
      doctorId: doctor.id,
    });
    this.clearCache(`courses_announcements_${courseId}`);
    return this.announcementRepo.save(announcement);
  }

  async getAnnouncements(courseId: string): Promise<Announcement[]> {
    const cacheKey = `courses_announcements_${courseId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    await this.findOne(courseId);
    const result = await this.announcementRepo.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });
    this.setCache(cacheKey, result);
    return result;
  }
}
