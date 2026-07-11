import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GradesService } from '../../src/grades/grades.service';
import { Grade, GradeComponent, Student, Course } from '../../src/database/entities';

const mockStudent = {
  id: 'student-id-1',
  studentId: '20250001',
  fullNameEn: 'Ahmed Mohamed',
  gpa: 3.2,
  cgpa: 3.0,
  totalCredits: 30,
  user: { fullNameEn: 'Ahmed Mohamed' },
  department: { nameEn: 'Computer Engineering' },
};

const mockCourse = {
  id: 'course-id-1',
  code: 'CS101',
  nameEn: 'Introduction to CS',
  credits: 3,
};

const mockGrade = {
  id: 'grade-id-1',
  studentId: 'student-id-1',
  courseId: 'course-id-1',
  semesterId: 'semester-id-1',
  component: GradeComponent.MIDTERM,
  score: 45,
  maxScore: 50,
  weight: 0.4,
  isPublished: false,
  gradedAt: new Date(),
  createdAt: new Date(),
};

describe('GradesService', () => {
  let service: GradesService;
  let gradeRepo: any;
  let studentRepo: any;
  let courseRepo: any;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findAndCount: jest.fn(),
  });

  beforeEach(async () => {
    gradeRepo = mockRepo();
    studentRepo = mockRepo();
    courseRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: getRepositoryToken(Grade), useValue: gradeRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(Course), useValue: courseRepo },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      studentId: 'student-id-1',
      courseId: 'course-id-1',
      semesterId: 'semester-id-1',
      component: GradeComponent.MIDTERM,
      score: 45,
      maxScore: 50,
      weight: 0.4,
    };

    it('should create a grade entry', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.findOne.mockResolvedValue(mockCourse);
      gradeRepo.findOne.mockResolvedValue(null);
      gradeRepo.create.mockReturnValue(mockGrade);
      gradeRepo.save.mockResolvedValue(mockGrade);

      const result = await service.create(createDto);

      expect(result.component).toBe(GradeComponent.MIDTERM);
      expect(result.score).toBe(45);
    });

    it('should throw NotFoundException for invalid student', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid course', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw when duplicate grade component exists', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.findOne.mockResolvedValue(mockCourse);
      gradeRepo.findOne.mockResolvedValue(mockGrade);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('createBulk', () => {
    it('should bulk create grades', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.findOne.mockResolvedValue(mockCourse);
      gradeRepo.findOne.mockResolvedValue(null);
      gradeRepo.create.mockReturnValue(mockGrade);
      gradeRepo.save.mockResolvedValue(mockGrade);

      const result = await service.createBulk({
        grades: [
          { studentId: 'student-id-1', courseId: 'course-id-1', semesterId: 's1', component: GradeComponent.MIDTERM, score: 45, maxScore: 50 },
          { studentId: 'student-id-1', courseId: 'course-id-1', semesterId: 's1', component: GradeComponent.FINAL, score: 40, maxScore: 50 },
        ],
      });

      expect(result.length).toBe(2);
    });
  });

  describe('update', () => {
    it('should update an unpublished grade', async () => {
      gradeRepo.findOne.mockResolvedValue(mockGrade);
      gradeRepo.save.mockResolvedValue({ ...mockGrade, score: 48 });

      const result = await service.update('grade-id-1', { score: 48 });

      expect(result.score).toBe(48);
    });

    it('should throw if grade is published', async () => {
      gradeRepo.findOne.mockResolvedValue({ ...mockGrade, isPublished: true });

      await expect(service.update('grade-id-1', { score: 48 })).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent grade', async () => {
      gradeRepo.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', { score: 48 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('publishGrades', () => {
    it('should publish unpublished grades', async () => {
      const unpublishedGrades = [mockGrade, { ...mockGrade, id: 'grade-id-2', component: GradeComponent.FINAL }];
      gradeRepo.find.mockResolvedValue(unpublishedGrades);
      gradeRepo.save.mockResolvedValue(unpublishedGrades.map(g => ({ ...g, isPublished: true })));

      const result = await service.publishGrades('course-id-1');

      expect(result.length).toBe(2);
      expect(result[0].isPublished).toBe(true);
    });

    it('should throw when no unpublished grades exist', async () => {
      gradeRepo.find.mockResolvedValue([]);

      await expect(service.publishGrades('course-id-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStudentGrades', () => {
    it('should return grades for a student', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      gradeRepo.find.mockResolvedValue([mockGrade]);

      const result = await service.getStudentGrades('student-id-1');

      expect(result.length).toBe(1);
    });

    it('should throw for non-existent student', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      await expect(service.getStudentGrades('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStudentTranscript', () => {
    it('should return formatted transcript', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      gradeRepo.find.mockResolvedValue([
        { ...mockGrade, course: { code: 'CS101', nameEn: 'Intro CS', credits: 3 }, component: GradeComponent.MIDTERM, score: 45, maxScore: 50, weight: 0.4 },
        { ...mockGrade, course: { code: 'CS101', nameEn: 'Intro CS', credits: 3 }, component: GradeComponent.TOTAL, score: 90, maxScore: 100, weight: 1 },
      ]);

      const result = await service.getStudentTranscript('student-id-1');

      expect(result.studentId).toBe('20250001');
      expect(result.courses.length).toBe(1);
      expect(result.courses[0].code).toBe('CS101');
    });

    it('should throw for non-existent student', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      await expect(service.getStudentTranscript('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
