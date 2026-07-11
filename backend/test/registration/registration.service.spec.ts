import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegistrationService } from '../../src/registration/registration.service';
import { CourseRegistration, RegistrationStatus, Student, Course } from '../../src/database/entities';

const mockStudent = {
  id: 'student-id-1',
  studentId: '20250001',
  level: 2,
  gpa: 3.2,
  cgpa: 3.0,
  totalCredits: 30,
  registrations: [],
};

const mockCourse = {
  id: 'course-id-1',
  code: 'CS101',
  nameEn: 'Intro CS',
  credits: 3,
  maxStudents: 50,
  isActive: true,
  prerequisites: [],
  lectures: [],
};

const mockLectureMorning = {
  id: 'lec-1',
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:30',
};

const mockLectureAfternoon = {
  id: 'lec-2',
  dayOfWeek: 1,
  startTime: '11:00',
  endTime: '12:30',
};

describe('RegistrationService', () => {
  let service: RegistrationService;
  let regRepo: any;
  let studentRepo: any;
  let courseRepo: any;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    regRepo = mockRepo();
    studentRepo = mockRepo();
    courseRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: getRepositoryToken(CourseRegistration), useValue: regRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(Course), useValue: courseRepo },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      studentId: 'student-id-1',
      semesterId: 'semester-id-1',
      courseIds: ['course-id-1'],
    };

    it('should register a student with valid data', async () => {
      const courses = [
        { ...mockCourse, id: 'course-id-1', credits: 4 },
        { ...mockCourse, id: 'course-id-2', code: 'CS102', credits: 4 },
        { ...mockCourse, id: 'course-id-3', code: 'CS103', credits: 4 },
      ];
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.find.mockResolvedValue(courses);
      regRepo.create.mockImplementation((dto: any) => dto);
      regRepo.save.mockResolvedValue(courses.map((c) => ({
        id: `reg-${c.id}`, studentId: 'student-id-1', courseId: c.id, status: RegistrationStatus.PENDING, credits: c.credits,
      })));

      const result = await service.register({ ...registerDto, courseIds: ['course-id-1', 'course-id-2', 'course-id-3'] });

      expect(result.message).toBe('Registration submitted. Pending approval.');
      expect(result.registrations.length).toBe(3);
      expect(result.totalCredits).toBe(12);
    });

    it('should throw NotFoundException for non-existent student', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw when course is not found or inactive', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.find.mockResolvedValue([]);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw when total credits exceed maximum', async () => {
      const heavyCourses = [
        { ...mockCourse, id: 'c1', credits: 6 },
        { ...mockCourse, id: 'c2', credits: 6 },
        { ...mockCourse, id: 'c3', credits: 6 },
        { ...mockCourse, id: 'c4', credits: 6 },
      ];
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.find.mockResolvedValue(heavyCourses);

      await expect(service.register({ ...registerDto, courseIds: ['c1', 'c2', 'c3', 'c4'] }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw when course is at full capacity', async () => {
      const fullCourse = { ...mockCourse, id: 'c1', credits: 3, maxStudents: 1 };
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.find.mockResolvedValue([fullCourse]);
      regRepo.count.mockResolvedValue(1);

      await expect(service.register({ ...registerDto, courseIds: ['c1'] }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw when there is a schedule conflict', async () => {
      const conflictCourseB = {
        ...mockCourse,
        id: 'course-id-2',
        code: 'CS102',
        lectures: [{ id: 'lec-other', dayOfWeek: 1, startTime: '10:00', endTime: '11:00' }],
      };
      const courseWithLec = {
        ...mockCourse,
        lectures: [{ id: 'lec-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:30' }],
      };
      studentRepo.findOne.mockResolvedValue({ ...mockStudent, registrations: [] });
      courseRepo.find.mockResolvedValue([courseWithLec, conflictCourseB]);

      await expect(service.register({ ...registerDto, courseIds: ['course-id-1', 'course-id-2'] }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw when prerequisites are missing', async () => {
      const courseWithPrereq = {
        ...mockCourse,
        prerequisites: [{ id: 'prereq-id', code: 'CS100', nameEn: 'Pre-CS' }],
      };
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.find.mockResolvedValue([courseWithPrereq]);

      await expect(service.register({ ...registerDto, courseIds: ['course-id-1'] }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw when already registered for a course', async () => {
      const alreadyRegistered = {
        courseId: 'course-id-1',
        status: RegistrationStatus.PENDING,
      };
      studentRepo.findOne.mockResolvedValue({
        ...mockStudent,
        registrations: [alreadyRegistered],
      });
      courseRepo.find.mockResolvedValue([mockCourse]);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('dropRegistration', () => {
    it('should drop a registration', async () => {
      const reg = { id: 'reg-id-1', status: RegistrationStatus.APPROVED, course: mockCourse };
      regRepo.findOne.mockResolvedValue(reg);
      regRepo.save.mockResolvedValue({ ...reg, status: RegistrationStatus.DROPPED });

      const result = await service.dropRegistration('reg-id-1');

      expect(result.status).toBe(RegistrationStatus.DROPPED);
    });

    it('should throw if already dropped', async () => {
      regRepo.findOne.mockResolvedValue({ id: 'reg-id-1', status: RegistrationStatus.DROPPED });

      await expect(service.dropRegistration('reg-id-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if not found', async () => {
      regRepo.findOne.mockResolvedValue(null);

      await expect(service.dropRegistration('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveRegistration', () => {
    it('should approve a pending registration', async () => {
      const reg = { id: 'reg-id-1', status: RegistrationStatus.PENDING, course: mockCourse, student: mockStudent };
      regRepo.findOne.mockResolvedValue(reg);
      regRepo.save.mockImplementation((r: any) => Promise.resolve({ ...r, approvedAt: new Date() }));

      const result = await service.approveRegistration('reg-id-1');

      expect(result.status).toBe(RegistrationStatus.APPROVED);
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw if registration is not pending', async () => {
      regRepo.findOne.mockResolvedValue({ id: 'reg-id-1', status: RegistrationStatus.REJECTED });

      await expect(service.approveRegistration('reg-id-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if not found', async () => {
      regRepo.findOne.mockResolvedValue(null);

      await expect(service.approveRegistration('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectRegistration', () => {
    it('should reject a pending registration', async () => {
      regRepo.findOne.mockResolvedValue({ id: 'reg-id-1', status: RegistrationStatus.PENDING });
      regRepo.save.mockResolvedValue({ id: 'reg-id-1', status: RegistrationStatus.REJECTED });

      const result = await service.rejectRegistration('reg-id-1', 'Insufficient prerequisites');

      expect(result.status).toBe(RegistrationStatus.REJECTED);
    });

    it('should throw if registration is already processed', async () => {
      regRepo.findOne.mockResolvedValue({ id: 'reg-id-1', status: RegistrationStatus.APPROVED });

      await expect(service.rejectRegistration('reg-id-1', 'reason')).rejects.toThrow(BadRequestException);
    });
  });
});
