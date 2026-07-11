import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../database/entities/academic-year.entity';
import { Semester, SemesterType } from '../database/entities/semester.entity';
import { paginate, PaginatedResult, getPaginationParams, getSkipTake } from '../common/utils/pagination';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(
    @InjectRepository(AcademicYear)
    private academicYearRepository: Repository<AcademicYear>,
    @InjectRepository(Semester)
    private semesterRepository: Repository<Semester>,
  ) {}

  async createAcademicYear(dto: Partial<AcademicYear>): Promise<AcademicYear> {
    const existing = await this.academicYearRepository.findOne({ where: { year: dto.year } });
    if (existing) throw new ConflictException(`Academic year ${dto.year} already exists`);
    const year = this.academicYearRepository.create(dto);
    return this.academicYearRepository.save(year);
  }

  async findAllAcademicYears(query: any): Promise<PaginatedResult<AcademicYear>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);
    const [data, total] = await this.academicYearRepository.findAndCount({
      skip, take,
      relations: { semesters: true },
      order: { year: 'DESC' },
    });
    return paginate(data, total, params);
  }

  async findAcademicYear(id: string): Promise<AcademicYear> {
    const year = await this.academicYearRepository.findOne({
      where: { id },
      relations: { semesters: true },
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async updateAcademicYear(id: string, dto: Partial<AcademicYear>): Promise<AcademicYear> {
    const year = await this.findAcademicYear(id);
    Object.assign(year, dto);
    return this.academicYearRepository.save(year);
  }

  async removeAcademicYear(id: string): Promise<void> {
    const result = await this.academicYearRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Academic year not found');
  }

  async getActiveAcademicYear(): Promise<AcademicYear | null> {
    return this.academicYearRepository.findOne({
      where: { isActive: true },
      relations: { semesters: true },
    });
  }

  async setActiveAcademicYear(id: string): Promise<AcademicYear> {
    await this.academicYearRepository.update({ isActive: true }, { isActive: false });
    const year = await this.findAcademicYear(id);
    year.isActive = true;
    return this.academicYearRepository.save(year);
  }

  async createSemester(dto: Partial<Semester>): Promise<Semester> {
    if (dto.academicYearId) {
      const year = await this.findAcademicYear(dto.academicYearId);
    }
    const semester = this.semesterRepository.create(dto);
    return this.semesterRepository.save(semester);
  }

  async findAllSemesters(query: any): Promise<PaginatedResult<Semester>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);
    const where: any = {};
    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const [data, total] = await this.semesterRepository.findAndCount({
      where, skip, take,
      relations: { academicYear: true },
      order: { startDate: 'DESC' },
    });
    return paginate(data, total, params);
  }

  async findSemester(id: string): Promise<Semester> {
    const semester = await this.semesterRepository.findOne({
      where: { id },
      relations: { academicYear: true },
    });
    if (!semester) throw new NotFoundException('Semester not found');
    return semester;
  }

  async updateSemester(id: string, dto: Partial<Semester>): Promise<Semester> {
    const semester = await this.findSemester(id);
    Object.assign(semester, dto);
    return this.semesterRepository.save(semester);
  }

  async removeSemester(id: string): Promise<void> {
    const result = await this.semesterRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Semester not found');
  }

  async getActiveSemester(): Promise<Semester | null> {
    return this.semesterRepository.findOne({
      where: { isActive: true },
      relations: { academicYear: true },
    });
  }
}
