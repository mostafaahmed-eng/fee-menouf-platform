import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../database/entities/exam.entity';
import { ExamSchedule } from '../database/entities/exam-schedule.entity';
import { paginate, PaginatedResult, getPaginationParams, getSkipTake } from '../common/utils/pagination';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(ExamSchedule)
    private examScheduleRepository: Repository<ExamSchedule>,
  ) {}

  async create(dto: Partial<Exam>): Promise<Exam> {
    const exam = this.examRepository.create(dto);
    return this.examRepository.save(exam);
  }

  async findAll(query: any): Promise<PaginatedResult<Exam>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);
    const where: any = {};
    if (query.courseId) where.courseId = query.courseId;
    if (query.semesterId) where.semesterId = query.semesterId;
    if (query.type) where.type = query.type;
    const [data, total] = await this.examRepository.findAndCount({
      where, skip, take,
      relations: { course: true, semester: true, schedules: { classroom: true, invigilator: { user: true } } },
      order: { date: 'ASC' },
    });
    return paginate(data, total, params);
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: { course: true, semester: true, schedules: { classroom: true, invigilator: { user: true } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async update(id: string, dto: Partial<Exam>): Promise<Exam> {
    const exam = await this.findOne(id);
    Object.assign(exam, dto);
    return this.examRepository.save(exam);
  }

  async remove(id: string): Promise<void> {
    const result = await this.examRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Exam not found');
  }

  async createSchedule(dto: Partial<ExamSchedule>): Promise<ExamSchedule> {
    const schedule = this.examScheduleRepository.create(dto);
    return this.examScheduleRepository.save(schedule);
  }

  async findSchedules(examId: string): Promise<ExamSchedule[]> {
    return this.examScheduleRepository.find({
      where: { examId },
      relations: { classroom: true, invigilator: { user: true } },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async removeSchedule(id: string): Promise<void> {
    const result = await this.examScheduleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Exam schedule not found');
  }
}
