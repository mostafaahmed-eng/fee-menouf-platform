import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Program } from '../database/entities';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(
    @InjectRepository(Program)
    private programRepository: Repository<Program>,
  ) {}

  async create(dto: CreateProgramDto): Promise<Program> {
    const program = this.programRepository.create(dto);
    return this.programRepository.save(program);
  }

  async findAll(query: any = {}): Promise<Program[]> {
    const where: FindOptionsWhere<Program> = {};
    if (query.departmentId) where.departmentId = query.departmentId;
    return this.programRepository.find({
      where,
      relations: { department: true, students: true },
      order: { nameAr: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: { department: true, students: true, courses: true },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async update(id: string, dto: UpdateProgramDto): Promise<Program> {
    const program = await this.findOne(id);
    Object.assign(program, dto);
    return this.programRepository.save(program);
  }

  async remove(id: string): Promise<void> {
    const program = await this.findOne(id);
    await this.programRepository.remove(program);
  }
}
