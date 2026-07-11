import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseMaterial, MaterialType } from '../database/entities/course-material.entity';
import { paginate, PaginatedResult, getPaginationParams, getSkipTake } from '../common/utils/pagination';

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  constructor(
    @InjectRepository(CourseMaterial)
    private materialRepository: Repository<CourseMaterial>,
  ) {}

  async create(dto: Partial<CourseMaterial>): Promise<CourseMaterial> {
    const material = this.materialRepository.create(dto);
    return this.materialRepository.save(material);
  }

  async findByCourse(courseId: string, query: any): Promise<PaginatedResult<CourseMaterial>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);
    const where: any = { courseId };
    if (query.type) where.type = query.type;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished === 'true';
    const [data, total] = await this.materialRepository.findAndCount({
      where, skip, take,
      relations: { uploadedBy: { user: true } },
      order: { uploadedAt: 'DESC' },
    });
    return paginate(data, total, params);
  }

  async findOne(id: string): Promise<CourseMaterial> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: { uploadedBy: { user: true }, course: true },
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async update(id: string, dto: Partial<CourseMaterial>): Promise<CourseMaterial> {
    const material = await this.findOne(id);
    Object.assign(material, dto);
    return this.materialRepository.save(material);
  }

  async remove(id: string): Promise<void> {
    const result = await this.materialRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Material not found');
  }
}
