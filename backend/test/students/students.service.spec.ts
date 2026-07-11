import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StudentsService } from '../../src/students/students.service';
import { Student, StudentStatus } from '../../src/database/entities/student.entity';

const mockStudent = {
  id: 'student-id-1',
  studentId: '20250001',
  nationalId: '1234567890',
  level: 2,
  gpa: 3.5,
  cgpa: 3.2,
  totalCredits: 60,
  status: StudentStatus.ACTIVE,
  academicWarnings: 0,
  enrollmentDate: new Date('2024-09-01'),
  user: {
    fullNameAr: 'أحمد محمد',
    fullNameEn: 'Ahmed Mohamed',
    email: 'ahmed@fee-menouf.edu.eg',
  },
  department: { nameEn: 'Computer Engineering', nameAr: 'هندسة الحاسبات' },
  program: { nameEn: 'B.Sc. Computer Engineering' },
  academicYear: { year: '2024-2025' },
  semester: { nameEn: 'Fall 2024' },
  registrations: [{ id: 'reg-1', status: 'APPROVED', course: { code: 'CS101' } }],
};

describe('StudentsService', () => {
  let service: StudentsService;
  let studentRepo: any;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      getRepository: jest.fn(),
    },
  });

  beforeEach(async () => {
    studentRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getRepositoryToken(Student), useValue: studentRepo },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      studentRepo.findAndCount.mockResolvedValue([[mockStudent], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by department', async () => {
      studentRepo.findAndCount.mockResolvedValue([[mockStudent], 1]);

      await service.findAll({ departmentId: 'dept-1' });

      expect(studentRepo.findAndCount).toHaveBeenCalled();
    });

    it('should return empty array when no students match', async () => {
      studentRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should search by name or student ID', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockStudent], 1]),
      };
      studentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ search: 'Ahmed' });

      expect(result.data.length).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a student with relations', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);

      const result = await service.findOne('student-id-1');

      expect(result.id).toBe('student-id-1');
    });

    it('should throw NotFoundException for non-existent student', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByStudentId', () => {
    it('should find student by studentId', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);

      const result = await service.findByStudentId('20250001');

      expect(result).toBeDefined();
      expect(studentRepo.findOne).toHaveBeenCalledWith({
        where: { studentId: '20250001' },
        relations: { user: true, department: true, program: true },
      });
    });

    it('should return null if not found', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      const result = await service.findByStudentId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return student', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      studentRepo.save.mockResolvedValue({ ...mockStudent, level: 3 });

      const result = await service.update('student-id-1', { level: 3 });

      expect(result.level).toBe(3);
    });
  });

  describe('getGrades', () => {
    it('should return grades for a student', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      const mockGradeRepo = {
        find: jest.fn().mockResolvedValue([{ id: 'grade-1', score: 90, course: { code: 'CS101' } }]),
      };
      studentRepo.manager.getRepository.mockReturnValue(mockGradeRepo);

      const result = await service.getGrades('student-id-1');

      expect(result.length).toBe(1);
    });
  });

  describe('getAttendance', () => {
    it('should return attendance records', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      const mockAttendanceRepo = {
        find: jest.fn().mockResolvedValue([{ id: 'att-1', status: 'PRESENT' }]),
      };
      studentRepo.manager.getRepository.mockReturnValue(mockAttendanceRepo);

      const result = await service.getAttendance('student-id-1');

      expect(result.length).toBe(1);
    });
  });

  describe('getRegistrations', () => {
    it('should return registration records', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      const mockRegRepo = {
        find: jest.fn().mockResolvedValue([{ id: 'reg-1', status: 'APPROVED' }]),
      };
      studentRepo.manager.getRepository.mockReturnValue(mockRegRepo);

      const result = await service.getRegistrations('student-id-1');

      expect(result.length).toBe(1);
    });
  });
});
