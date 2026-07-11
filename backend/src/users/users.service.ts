import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { paginate, PaginatedResult, getPaginationParams, getSkipTake } from '../common/utils/pagination';
import { sanitizeUser } from '../common/utils/sanitize-user.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const salt = await bcrypt.genSalt(this.configService.get<number>('app.bcryptSaltRounds') || 12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async findAll(query: UserFilterDto): Promise<PaginatedResult<User>> {
    const params = getPaginationParams(query);
    const { skip, take } = getSkipTake(params.page, params.limit);

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      const search = `%${query.search}%`;
      const [users, total] = await this.userRepository
        .createQueryBuilder('user')
        .where('user.full_name_ar ILIKE :search OR user.full_name_en ILIKE :search OR user.email ILIKE :search', { search })
        .skip(skip)
        .take(take)
        .orderBy('user.created_at', 'DESC')
        .getManyAndCount();

      return paginate(users.map((u) => this.sanitizeUser(u)), total, params);
    }

    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take,
      order: { [params.sortBy || 'createdAt']: params.sortOrder || 'DESC' },
    });

    return paginate(users.map((u) => this.sanitizeUser(u)), total, params);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        student: { department: true, program: true },
        doctor: { department: true },
        ta: { department: true, supervisorDoctor: true },
        advisor: { department: true },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, dto);
    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = !user.isActive;
    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLogin: new Date() });
  }

  private sanitizeUser(user: User): User {
    return sanitizeUser(user) as User;
  }
}
