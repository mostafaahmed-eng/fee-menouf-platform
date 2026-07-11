import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoursesService } from '../../src/courses/courses.service';
import { Course, CourseMaterial, Announcement } from '../../src/database/entities';

const mockCourse = {
  id: 'course-id-1',
  code: 'CS101',
  nameAr: 'مقدمة في علوم الحاسب',
  nameEn: 'Introduction to Computer Science',
  credits: 3,
  capacity: 100,
  maxStudents: 50,
  isActive: true,
  departmentId: 'dept-id-1',
  doctorId: 'doc-id-1',
  prerequisites: [],
  registrations: [],
  lectures: [],
};

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepo: any;
  let materialRepo: any;
  let announcementRepo: any;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    findByIds: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findAndCount: jest.fn(),
  });

  beforeEach(async () => {
    courseRepo = mockRepo();
    materialRepo = mockRepo();
    announcementRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: getRepositoryToken(CourseMaterial), useValue: materialRepo },
        { provide: getRepositoryToken(Announcement), useValue: announcementRepo },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated courses', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);
      courseRepo.findAndCount.mockResolvedValue([[mockCourse], 1]);

      const result = await service.findAll({});

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should filter courses by departmentId', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);

      await service.findAll({ departmentId: 'dept-id-1' });

      expect(courseRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ departmentId: 'dept-id-1' }),
        }),
      );
    });

    it('should search courses by code or name', async () => {
      courseRepo.find.mockResolvedValue([mockCourse]);

      await service.findAll({ search: 'CS101' });

      expect(courseRepo.find).toHaveBeenCalled();
    });

    it('should return empty array when no courses found', async () => {
      courseRepo.find.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a course with relations', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);

      const result = await service.findOne('course-id-1');

      expect(result.id).toBe('course-id-1');
      expect(courseRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'course-id-1' },
        relations: ['department', 'doctor', 'doctor.user', 'prerequisites', 'program'],
      });
    });

    it('should throw NotFoundException for non-existent course', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      code: 'CS102',
      nameAr: 'هياكل البيانات',
      nameEn: 'Data Structures',
      credits: 3,
    };

    it('should create a new course', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      courseRepo.create.mockReturnValue({ ...mockCourse, code: 'CS102' });
      courseRepo.save.mockResolvedValue({ ...mockCourse, code: 'CS102' });

      const result = await service.create(createDto);

      expect(result.code).toBe('CS102');
      expect(courseRepo.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if course code already exists', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should validate prerequisites when provided', async () => {
      const dtoWithPrereqs = { ...createDto, prerequisiteIds: ['prereq-id-1'] };
      courseRepo.findOne.mockResolvedValue(null);
      courseRepo.findByIds.mockResolvedValue([{ id: 'prereq-id-1' }]);
      courseRepo.create.mockReturnValue({ ...mockCourse, code: 'CS102' });
      courseRepo.save.mockResolvedValue({ ...mockCourse, code: 'CS102' });

      const result = await service.create(dtoWithPrereqs);

      expect(courseRepo.findByIds).toHaveBeenCalledWith(['prereq-id-1']);
    });

    it('should throw if prerequisite not found', async () => {
      const dtoWithPrereqs = { ...createDto, prerequisiteIds: ['nonexistent-prereq'] };
      courseRepo.findOne.mockResolvedValue(null);
      courseRepo.findByIds.mockResolvedValue([]);

      await expect(service.create(dtoWithPrereqs)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update an existing course', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      courseRepo.save.mockResolvedValue({ ...mockCourse, nameEn: 'Advanced CS' });

      const result = await service.update('course-id-1', { nameEn: 'Advanced CS' });

      expect(result.nameEn).toBe('Advanced CS');
    });

    it('should throw NotFoundException when updating non-existent course', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', { nameEn: 'New Name' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a course', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      courseRepo.remove.mockResolvedValue(mockCourse);

      await service.remove('course-id-1');

      expect(courseRepo.remove).toHaveBeenCalledWith(mockCourse);
    });

    it('should throw NotFoundException when deleting non-existent course', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEnrolledStudents (getStudents)', () => {
    it('should return enrolled students', async () => {
      const courseWithRegs = {
        ...mockCourse,
        registrations: [
          {
            status: 'APPROVED',
            student: { id: 's1', studentId: '20250001', gpa: 3.5, level: 2, user: { fullNameEn: 'Ahmed', email: 'a@test.com' } },
          },
          {
            status: 'PENDING',
            student: { id: 's2', studentId: '20250002', gpa: 3.0, level: 2, user: { fullNameEn: 'Mohamed', email: 'm@test.com' } },
          },
        ],
      };
      courseRepo.findOne.mockResolvedValue(courseWithRegs);

      const result = await service.getStudents('course-id-1');

      expect(result.length).toBe(1);
      expect(result[0].studentId).toBe('20250001');
    });

    it('should throw if course not found', async () => {
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.getStudents('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
