import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department, StudentStatus } from '../database/entities';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);
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
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.deptRepo.findOne({
      where: [{ nameEn: dto.nameEn }, { code: dto.code }],
    });
    if (existing) throw new BadRequestException('Department name or code already exists');
    const dept = this.deptRepo.create(dto);
    this.clearCache('departments_findAll');
    return this.deptRepo.save(dept);
  }

  async findAll(): Promise<Department[]> {
    const cacheKey = 'departments_findAll';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    const result = await this.deptRepo.find({ order: { nameEn: 'ASC' } });
    this.setCache(cacheKey, result);
    return result;
  }

  async findOne(id: string): Promise<Department> {
    const cacheKey = `departments_findOne_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    const dept = await this.deptRepo.findOne({
      where: { id },
      relations: ['students', 'students.user', 'doctors', 'doctors.user', 'courses', 'programs', 'advisors'],
    });
    if (!dept) throw new NotFoundException('Department not found');
    this.setCache(cacheKey, dept);
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    const dept = await this.findOne(id);
    Object.assign(dept, dto);
    this.clearCache();
    return this.deptRepo.save(dept);
  }

  async remove(id: string): Promise<void> {
    const dept = await this.findOne(id);
    this.clearCache();
    await this.deptRepo.remove(dept);
  }

  async getStatistics(id: string) {
    const cacheKey = `departments_statistics_${id}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    const dept = await this.findOne(id);
    const result = {
      name: dept.nameEn,
      code: dept.code,
      faculty: dept.faculty,
      totalStudents: dept.students?.length || 0,
      totalDoctors: dept.doctors?.length || 0,
      totalCourses: dept.courses?.length || 0,
      totalPrograms: dept.programs?.length || 0,
      totalAdvisors: dept.advisors?.length || 0,
      activeStudents: dept.students?.filter((s) => s.status === StudentStatus.ACTIVE).length || 0,
      graduatedStudents: dept.students?.filter((s) => s.status === StudentStatus.GRADUATED).length || 0,
    };
    this.setCache(cacheKey, result);
    return result;
  }
}
