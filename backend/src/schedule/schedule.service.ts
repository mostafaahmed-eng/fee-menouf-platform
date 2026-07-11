import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Schedule, ScheduleType, ScheduleStatus } from '../database/entities/schedule.entity';
import { paginate, PaginatedResult, getPaginationParams, getSkipTake } from '../common/utils/pagination';

interface FindAllQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  type?: ScheduleType;
  status?: ScheduleStatus;
  semesterId?: string;
  departmentId?: string;
  [key: string]: unknown;
}

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {}

  async create(dto: Partial<Schedule>): Promise<Schedule> {
    const schedule = this.scheduleRepository.create(dto);
    return this.scheduleRepository.save(schedule);
  }

  async findAll(query: FindAllQuery): Promise<PaginatedResult<Schedule>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);
    const where: FindOptionsWhere<Schedule> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.semesterId) where.semesterId = query.semesterId;
    if (query.departmentId) where.departmentId = query.departmentId;
    const [data, total] = await this.scheduleRepository.findAndCount({
      where, skip, take,
      order: { createdAt: 'DESC' },
    });
    return paginate(data, total, params);
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async update(id: string, dto: Partial<Schedule>): Promise<Schedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    return this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const result = await this.scheduleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Schedule not found');
  }

  async publish(id: string): Promise<Schedule> {
    const schedule = await this.findOne(id);
    schedule.status = ScheduleStatus.PUBLISHED;
    return this.scheduleRepository.save(schedule);
  }

  async archive(id: string): Promise<Schedule> {
    const schedule = await this.findOne(id);
    schedule.status = ScheduleStatus.ARCHIVED;
    return this.scheduleRepository.save(schedule);
  }

  async generateLectureSchedule(semesterId: string, departmentId?: string): Promise<Schedule> {
    const startTime = Date.now();
    const schedule = this.scheduleRepository.create({
      type: ScheduleType.LECTURE,
      title: `Lecture Schedule - Semester ${semesterId}`,
      data: {},
      status: ScheduleStatus.DRAFT,
      semesterId,
      departmentId: departmentId || null,
      generationDuration: 0,
    });
    const saved = await this.scheduleRepository.save(schedule);
    saved.generationDuration = Date.now() - startTime;
    return this.scheduleRepository.save(saved);
  }

  async generateExamSchedule(semesterId: string, departmentId?: string): Promise<Schedule> {
    const startTime = Date.now();
    const schedule = this.scheduleRepository.create({
      type: ScheduleType.EXAM,
      title: `Exam Schedule - Semester ${semesterId}`,
      data: {},
      status: ScheduleStatus.DRAFT,
      semesterId,
      departmentId: departmentId || null,
      generationDuration: 0,
    });
    const saved = await this.scheduleRepository.save(schedule);
    saved.generationDuration = Date.now() - startTime;
    return this.scheduleRepository.save(saved);
  }
}
