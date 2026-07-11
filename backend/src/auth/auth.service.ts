import {
  Injectable, UnauthorizedException, ConflictException, BadRequestException,
  Logger, NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { User, UserRole } from '../database/entities/user.entity';
import { Student, StudentStatus } from '../database/entities/student.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { Ta } from '../database/entities/ta.entity';
import { Advisor } from '../database/entities/advisor.entity';
import { RegisterDto } from './dto/register.dto';
import { sanitizeUser } from '../common/utils/sanitize-user.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Ta)
    private taRepository: Repository<Ta>,
    @InjectRepository(Advisor)
    private advisorRepository: Repository<Advisor>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const SELF_REGISTRATION_ROLES = [UserRole.STUDENT];
    if (!SELF_REGISTRATION_ROLES.includes(dto.role)) {
      throw new BadRequestException(`Cannot self-register with role: ${dto.role}`);
    }

    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(this.configService.get<number>('app.bcryptSaltRounds') || 12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      fullNameAr: dto.fullNameAr,
      fullNameEn: dto.fullNameEn,
      role: dto.role,
      phone: dto.phone || undefined,
      isActive: true,
      isVerified: false,
    });
    const savedUser = await this.userRepository.save(user) as User;

    if (dto.role === UserRole.STUDENT) {
      const studentCount = await this.studentRepository.count();
      const student = this.studentRepository.create({
        userId: savedUser.id,
        studentId: `${new Date().getFullYear()}${String(studentCount + 1).padStart(4, '0')}`,
        departmentId: dto.departmentId || undefined,
        level: 1,
        nationalId: '',
        status: StudentStatus.ACTIVE,
        totalCredits: 0,
        gpa: 0,
        cgpa: 0,
        academicWarnings: 0,
      });
      await this.studentRepository.save(student);
    } else if (dto.role === UserRole.DOCTOR) {
      const doctorCount = await this.doctorRepository.count();
      const doctor = this.doctorRepository.create({
        userId: savedUser.id,
        employeeId: `DOC${String(doctorCount + 1).padStart(4, '0')}`,
        departmentId: dto.departmentId || undefined,
      });
      await this.doctorRepository.save(doctor);
    } else if (dto.role === UserRole.TA) {
      const taCount = await this.taRepository.count();
      const ta = this.taRepository.create({
        userId: savedUser.id,
        employeeId: `TA${String(taCount + 1).padStart(4, '0')}`,
        departmentId: dto.departmentId || undefined,
      });
      await this.taRepository.save(ta);
    } else if (dto.role === UserRole.ADVISOR) {
      const advisorCount = await this.advisorRepository.count();
      const advisor = this.advisorRepository.create({
        userId: savedUser.id,
        employeeId: `ADV${String(advisorCount + 1).padStart(4, '0')}`,
        departmentId: dto.departmentId || undefined,
      });
      await this.advisorRepository.save(advisor);
    }

    const tokens = await this.generateTokens(savedUser);
    return { user: this.sanitizeUser(savedUser), ...tokens };
  }

  async login(email: string, password: string, ip?: string) {
    this.checkLoginRateLimit(email, ip);

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginAttempts.delete(email);
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
      const user = await this.userRepository.findOne({ where: { id: payload.sub, isActive: true } });
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const tokens = await this.generateTokens(user);
      return { user: this.sanitizeUser(user), ...tokens };
    } catch (err) {
      this.logger.error(`Refresh token validation failed: ${err.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    await this.userRepository.update({ id: userId }, { refreshToken: null as unknown as string });
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        student: { department: true, program: true },
        doctor: { department: true },
        ta: { department: true },
        advisor: { department: true },
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const salt = await bcrypt.genSalt(this.configService.get<number>('app.bcryptSaltRounds') || 12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.refreshToken = undefined as unknown as string;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a password reset link has been sent' };
    }
    const resetToken = uuidv4();
    user.refreshToken = resetToken;
    await this.userRepository.save(user);
    this.logger.log(`Password reset requested for ${email}`);
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token) {
      throw new BadRequestException('Invalid reset token');
    }
    const user = await this.userRepository.findOne({ where: { refreshToken: token } });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const salt = await bcrypt.genSalt(this.configService.get<number>('app.bcryptSaltRounds') || 12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.refreshToken = null as unknown as string;
    await this.userRepository.save(user);
    this.logger.log(`Password reset completed for user: ${user.email}`);
    return { message: 'Password reset successfully' };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Invalid verification token');
    }
    if (!uuidValidate(token)) {
      throw new BadRequestException('Invalid verification token format');
    }
    const user = await this.userRepository.findOne({ where: { id: token } });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    user.isVerified = true;
    await this.userRepository.save(user);
    this.logger.log(`Email verified for user: ${user.email}`);
    return { message: 'Email verified successfully' };
  }

  async getAllUsers() {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
      issuer: this.configService.get<string>('jwt.issuer'),
      audience: this.configService.get<string>('jwt.audience'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '7d',
      issuer: this.configService.get<string>('jwt.issuer'),
      audience: this.configService.get<string>('jwt.audience'),
    });

    await this.userRepository.update(user.id, { refreshToken });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    return sanitizeUser(user);
  }

  private checkLoginRateLimit(email: string, ip?: string) {
    const key = email || ip || 'unknown';
    const attempts = this.loginAttempts.get(key);
    if (attempts) {
      const windowMs = this.configService.get<number>('app.loginRateLimitWindow') || 900000;
      const maxAttempts = this.configService.get<number>('app.loginRateLimitMax') || 5;
      const elapsed = Date.now() - attempts.lastAttempt.getTime();
      if (elapsed < windowMs && attempts.count >= maxAttempts) {
        this.logger.warn(`Account lockout triggered for ${key} (${attempts.count} attempts)`);
        throw new UnauthorizedException(
          `Too many login attempts. Please try again after ${Math.ceil((windowMs - elapsed) / 1000)} seconds`,
        );
      }
      if (elapsed >= windowMs) {
        this.loginAttempts.delete(key);
      }
    }
  }

  private recordFailedAttempt(email: string) {
    const key = email;
    const current = this.loginAttempts.get(key) || { count: 0, lastAttempt: new Date() };
    current.count += 1;
    current.lastAttempt = new Date();
    this.loginAttempts.set(key, current);
    if (current.count >= 5) {
      this.logger.warn(`Account lockout threshold reached for ${key}: ${current.count} failed attempts`);
    }
  }
}


