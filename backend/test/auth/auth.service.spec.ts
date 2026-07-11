import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { User, UserRole } from '../../src/database/entities/user.entity';
import { Student } from '../../src/database/entities/student.entity';
import { Doctor } from '../../src/database/entities/doctor.entity';
import { Ta } from '../../src/database/entities/ta.entity';
import { Advisor } from '../../src/database/entities/advisor.entity';

const mockUser = {
  id: 'user-id-1',
  email: 'student@fee-menouf.edu.eg',
  password: '$2b$10$hashedpassword',
  fullNameAr: 'أحمد محمد',
  fullNameEn: 'Ahmed Mohamed',
  role: UserRole.STUDENT,
  phone: '+201234567890',
  isActive: true,
  isVerified: false,
  lastLogin: null,
  refreshToken: 'old-refresh-token',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockStudent = {
  id: 'student-id-1',
  userId: 'user-id-1',
  studentId: '20250001',
  level: 1,
  departmentId: null,
  gpa: 0,
  cgpa: 0,
  totalCredits: 0,
  status: 'ACTIVE',
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: any;
  let studentRepo: any;
  let doctorRepo: any;
  let taRepo: any;
  let advisorRepo: any;
  let jwtService: any;
  let configService: any;

  const mockRepository = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
  });

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'app.bcryptSaltRounds': 12,
        'app.loginRateLimitWindow': 900000,
        'app.loginRateLimitMax': 5,
        'jwt.secret': 'test-secret',
        'jwt.refreshSecret': 'test-refresh-secret',
        'jwt.expiresIn': '15m',
        'jwt.refreshExpiresIn': '7d',
        'jwt.issuer': 'fee-menouf',
        'jwt.audience': 'fee-menouf-api',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    userRepo = mockRepository();
    studentRepo = mockRepository();
    doctorRepo = mockRepository();
    taRepo = mockRepository();
    advisorRepo = mockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(Doctor), useValue: doctorRepo },
        { provide: getRepositoryToken(Ta), useValue: taRepo },
        { provide: getRepositoryToken(Advisor), useValue: advisorRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens with valid credentials', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      userRepo.update.mockResolvedValue({ affected: 1 });

      const result = await authService.login('student@fee-menouf.edu.eg', 'password123');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('refreshToken');
      expect(userRepo.update).toHaveBeenCalledWith(mockUser.id, { lastLogin: expect.any(Date) });
    });

    it('should throw UnauthorizedException with invalid password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(authService.login('student@fee-menouf.edu.eg', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with inactive user', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(authService.login('student@fee-menouf.edu.eg', 'password123'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with non-existent email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(authService.login('unknown@fee-menouf.edu.eg', 'password123'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newstudent@fee-menouf.edu.eg',
      password: 'password123',
      fullNameAr: 'محمد علي',
      fullNameEn: 'Mohamed Ali',
      role: UserRole.STUDENT,
      departmentId: undefined,
      phone: undefined,
    };

    it('should create a new user and student, return tokens', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ ...mockUser, id: 'new-user-id', email: registerDto.email });
      userRepo.save.mockResolvedValue({ ...mockUser, id: 'new-user-id', email: registerDto.email });
      studentRepo.count.mockResolvedValue(0);
      studentRepo.create.mockReturnValue({ ...mockStudent, id: 'new-student-id' });
      studentRepo.save.mockResolvedValue({ ...mockStudent, id: 'new-student-id' });
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await authService.register(registerDto);

      expect(result.accessToken).toBe('mock-token');
      expect(result.user.email).toBe(registerDto.email);
      expect(userRepo.create).toHaveBeenCalled();
      expect(studentRepo.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto))
        .rejects.toThrow(ConflictException);
    });

    it('should create doctor when role is DOCTOR', async () => {
      const doctorDto = { ...registerDto, role: UserRole.DOCTOR };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ ...mockUser, id: 'new-user-id', email: doctorDto.email });
      userRepo.save.mockResolvedValue({ ...mockUser, id: 'new-user-id', email: doctorDto.email, role: UserRole.DOCTOR });
      doctorRepo.count.mockResolvedValue(0);
      doctorRepo.create.mockReturnValue({ id: 'new-doc-id' });
      doctorRepo.save.mockResolvedValue({ id: 'new-doc-id' });
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await authService.register(doctorDto);

      expect(result.accessToken).toBe('mock-token');
      expect(doctorRepo.create).toHaveBeenCalled();
    });

    it('should create advisor when role is ADVISOR', async () => {
      const advisorDto = { ...registerDto, role: UserRole.ADVISOR };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ ...mockUser, id: 'new-user-id', email: advisorDto.email });
      userRepo.save.mockResolvedValue({ ...mockUser, id: 'new-user-id', email: advisorDto.email, role: UserRole.ADVISOR });
      advisorRepo.count.mockResolvedValue(0);
      advisorRepo.create.mockReturnValue({ id: 'new-adv-id' });
      advisorRepo.save.mockResolvedValue({ id: 'new-adv-id' });
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await authService.register(advisorDto);

      expect(result.accessToken).toBe('mock-token');
      expect(advisorRepo.create).toHaveBeenCalled();
    });

    it('should create TA when role is TA', async () => {
      const taDto = { ...registerDto, role: UserRole.TA };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ ...mockUser, id: 'new-user-id', email: taDto.email });
      userRepo.save.mockResolvedValue({ ...mockUser, id: 'new-user-id', email: taDto.email, role: UserRole.TA });
      taRepo.count.mockResolvedValue(0);
      taRepo.create.mockReturnValue({ id: 'new-ta-id' });
      taRepo.save.mockResolvedValue({ id: 'new-ta-id' });
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await authService.register(taDto);

      expect(result.accessToken).toBe('mock-token');
      expect(taRepo.create).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should return new tokens with a valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id-1', email: mockUser.email, role: mockUser.role });
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await authService.refresh('old-refresh-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('Token expired'); });

      await expect(authService.refresh('expired-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if stored token does not match', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-id-1' });
      userRepo.findOne.mockResolvedValue({ ...mockUser, refreshToken: 'different-token' });

      await expect(authService.refresh('valid-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear the refresh token', async () => {
      userRepo.update.mockResolvedValue({ affected: 1 });

      const result = await authService.logout('user-id-1');

      expect(userRepo.update).toHaveBeenCalledWith('user-id-1', { refreshToken: undefined });
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('account lockout', () => {
    it('should lock account after 5 failed login attempts', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      for (let i = 0; i < 5; i++) {
        await expect(authService.login('student@fee-menouf.edu.eg', 'wrongpassword'))
          .rejects.toThrow(UnauthorizedException);
      }

      await expect(authService.login('student@fee-menouf.edu.eg', 'wrongpassword'))
        .rejects.toThrow('Too many login attempts');
    });
  });

  describe('changePassword', () => {
    it('should change password with correct old password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt' as never);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-hashed-password' as never);
      userRepo.save.mockResolvedValue({ ...mockUser, password: 'new-hashed-password' });

      const result = await authService.changePassword('user-id-1', 'old-password', 'new-password');

      expect(result.message).toBe('Password changed successfully');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException with wrong old password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(authService.changePassword('user-id-1', 'wrong-old', 'new-password'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(authService.changePassword('nonexistent-id', 'old', 'new'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
