import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom, ClassroomType } from '../database/entities';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

@Injectable()
export class ClassroomsService {
  private readonly logger = new Logger(ClassroomsService.name);
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
    @InjectRepository(Classroom)
    private readonly classroomRepo: Repository<Classroom>,
  ) {}

  async create(dto: CreateClassroomDto): Promise<Classroom> {
    const existing = await this.classroomRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Classroom code already exists');
    const classroom = this.classroomRepo.create(dto);
    this.clearCache();
    return this.classroomRepo.save(classroom);
  }

  async findAll(): Promise<Classroom[]> {
    const cacheKey = 'classrooms_findAll';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    const result = await this.classroomRepo.find({ order: { code: 'ASC' } });
    this.setCache(cacheKey, result);
    return result;
  }

  async findByType(type: ClassroomType): Promise<Classroom[]> {
    const cacheKey = `classrooms_findByType_${type}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    const result = await this.classroomRepo.find({ where: { type }, order: { code: 'ASC' } });
    this.setCache(cacheKey, result);
    return result;
  }

  async findAvailable(): Promise<Classroom[]> {
    const cacheKey = 'classrooms_findAvailable';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    const result = await this.classroomRepo.find({ where: { isActive: true }, order: { code: 'ASC' } });
    this.setCache(cacheKey, result);
    return result;
  }

  async findOne(id: string): Promise<Classroom> {
    const cacheKey = `classrooms_findOne_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    const classroom = await this.classroomRepo.findOne({
      where: { id },
      relations: ['examSchedules', 'examSchedules.exam', 'examSchedules.exam.course'],
    });
    if (!classroom) throw new NotFoundException('Classroom not found');
    this.setCache(cacheKey, classroom);
    return classroom;
  }

  async update(id: string, dto: UpdateClassroomDto): Promise<Classroom> {
    const classroom = await this.findOne(id);
    Object.assign(classroom, dto);
    this.clearCache();
    return this.classroomRepo.save(classroom);
  }

  async remove(id: string): Promise<void> {
    const classroom = await this.findOne(id);
    this.clearCache();
    await this.classroomRepo.remove(classroom);
  }
}
