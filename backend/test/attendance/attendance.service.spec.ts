import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceService } from '../../src/attendance/attendance.service';
import { Attendance, AttendanceStatus, AttendanceMethod, Lecture, LectureType } from '../../src/database/entities';

const mockLecture = {
  id: 'lec-id-1',
  courseId: 'course-id-1',
  title: 'Introduction Lecture',
  type: LectureType.LECTURE,
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:30',
  qrCode: null,
  qrExpiresAt: null,
  latitude: 30.5,
  longitude: 31.0,
  geolocationRadius: 50,
  room: 'Hall A',
};

const mockAttendance = {
  id: 'att-id-1',
  studentId: 'student-id-1',
  courseId: 'course-id-1',
  lectureId: 'lec-id-1',
  status: AttendanceStatus.PRESENT,
  method: AttendanceMethod.MANUAL,
  date: new Date(),
};

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: any;
  let lectureRepo: any;

  const mockRepo = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
  });

  beforeEach(async () => {
    attendanceRepo = mockRepo();
    lectureRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getRepositoryToken(Attendance), useValue: attendanceRepo },
        { provide: getRepositoryToken(Lecture), useValue: lectureRepo },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    jest.clearAllMocks();
  });

  describe('markAttendance', () => {
    const markDto = {
      studentId: 'student-id-1',
      courseId: 'course-id-1',
      lectureId: 'lec-id-1',
      status: AttendanceStatus.PRESENT,
    };

    it('should mark attendance and return a record', async () => {
      lectureRepo.findOne.mockResolvedValue(mockLecture);
      attendanceRepo.findOne.mockResolvedValue(null);
      attendanceRepo.create.mockReturnValue(mockAttendance);
      attendanceRepo.save.mockResolvedValue(mockAttendance);

      const result = await service.markAttendance(markDto, 'marker-id');

      expect(result.studentId).toBe('student-id-1');
      expect(result.method).toBe(AttendanceMethod.MANUAL);
    });

    it('should throw NotFoundException for non-existent lecture', async () => {
      lectureRepo.findOne.mockResolvedValue(null);

      await expect(service.markAttendance(markDto, 'marker-id'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for duplicate mark', async () => {
      lectureRepo.findOne.mockResolvedValue(mockLecture);
      attendanceRepo.findOne.mockResolvedValue(mockAttendance);

      await expect(service.markAttendance(markDto, 'marker-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('markQrAttendance', () => {
    const qrPayload = { id: 'lec-id-1', lectureId: 'lec-id-1', courseId: 'course-id-1', timestamp: new Date().toISOString() };
    const validQrCode = Buffer.from(JSON.stringify(qrPayload)).toString('base64');

    const qrDto = {
      studentId: 'student-id-1',
      lectureId: 'lec-id-1',
      qrCode: validQrCode,
    };

    it('should mark QR attendance with valid QR code', async () => {
      const futureDate = new Date(Date.now() + 60000);
      lectureRepo.findOne.mockResolvedValue({ ...mockLecture, qrCode: validQrCode, qrExpiresAt: futureDate });
      attendanceRepo.findOne.mockResolvedValue(null);
      attendanceRepo.create.mockReturnValue({ ...mockAttendance, method: AttendanceMethod.QR });
      attendanceRepo.save.mockResolvedValue({ ...mockAttendance, method: AttendanceMethod.QR });

      const result = await service.markQrAttendance(qrDto);

      expect(result.method).toBe(AttendanceMethod.QR);
      expect(result.status).toBe(AttendanceStatus.PRESENT);
    });

    it('should throw if no active QR code', async () => {
      lectureRepo.findOne.mockResolvedValue({ ...mockLecture, qrCode: null, qrExpiresAt: null });

      await expect(service.markQrAttendance(qrDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw if QR code is expired', async () => {
      const pastDate = new Date(Date.now() - 60000);
      lectureRepo.findOne.mockResolvedValue({ ...mockLecture, qrCode: validQrCode, qrExpiresAt: pastDate });

      await expect(service.markQrAttendance(qrDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw if QR code does not match lecture', async () => {
      const futureDate = new Date(Date.now() + 60000);
      const wrongPayload = { ...qrPayload, lectureId: 'different-lecture' };
      const wrongQr = Buffer.from(JSON.stringify(wrongPayload)).toString('base64');
      lectureRepo.findOne.mockResolvedValue({ ...mockLecture, qrCode: wrongQr, qrExpiresAt: futureDate });

      await expect(service.markQrAttendance({ ...qrDto, qrCode: wrongQr }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw for duplicate QR attendance', async () => {
      const futureDate = new Date(Date.now() + 60000);
      lectureRepo.findOne.mockResolvedValue({ ...mockLecture, qrCode: validQrCode, qrExpiresAt: futureDate });
      attendanceRepo.findOne.mockResolvedValue(mockAttendance);

      await expect(service.markQrAttendance(qrDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('markGeolocationAttendance', () => {
    const geoDto = {
      studentId: 'student-id-1',
      lectureId: 'lec-id-1',
      latitude: 30.5001,
      longitude: 31.0001,
    };

    it('should mark attendance when within range', async () => {
      lectureRepo.findOne.mockResolvedValue(mockLecture);
      attendanceRepo.findOne.mockResolvedValue(null);
      attendanceRepo.create.mockReturnValue({ ...mockAttendance, method: AttendanceMethod.GEOLOCATION });
      attendanceRepo.save.mockResolvedValue({ ...mockAttendance, method: AttendanceMethod.GEOLOCATION });

      const result = await service.markGeolocationAttendance(geoDto);

      expect(result.method).toBe(AttendanceMethod.GEOLOCATION);
      expect(result.status).toBe(AttendanceStatus.PRESENT);
    });

    it('should throw if lecture has no geolocation set', async () => {
      lectureRepo.findOne.mockResolvedValue({ ...mockLecture, latitude: null, longitude: null });

      await expect(service.markGeolocationAttendance(geoDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw if student is too far', async () => {
      const farAway = { latitude: 31.5, longitude: 32.0 };
      lectureRepo.findOne.mockResolvedValue(mockLecture);

      await expect(service.markGeolocationAttendance({ ...geoDto, ...farAway }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw for duplicate geolocation attendance', async () => {
      lectureRepo.findOne.mockResolvedValue(mockLecture);
      attendanceRepo.findOne.mockResolvedValue(mockAttendance);

      await expect(service.markGeolocationAttendance(geoDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStudentAttendance', () => {
    it('should return attendance records for a student', async () => {
      attendanceRepo.find.mockResolvedValue([mockAttendance]);

      const result = await service.getStudentAttendance('student-id-1');

      expect(result.length).toBe(1);
      expect(attendanceRepo.find).toHaveBeenCalledWith({
        where: { studentId: 'student-id-1' },
        relations: ['lecture', 'course'],
        order: { date: 'DESC' },
      });
    });

    it('should return empty array for student with no records', async () => {
      attendanceRepo.find.mockResolvedValue([]);

      const result = await service.getStudentAttendance('student-id-1');

      expect(result).toEqual([]);
    });
  });

  describe('getCourseAttendance', () => {
    it('should return attendance records for a course', async () => {
      attendanceRepo.find.mockResolvedValue([mockAttendance]);

      const result = await service.getCourseAttendance('course-id-1');

      expect(result.length).toBe(1);
      expect(attendanceRepo.find).toHaveBeenCalledWith({
        where: { courseId: 'course-id-1' },
        relations: ['student', 'student.user', 'lecture'],
        order: { date: 'DESC' },
      });
    });
  });

  describe('getLectureAttendance', () => {
    it('should return aggregated lecture attendance', async () => {
      lectureRepo.findOne.mockResolvedValue(mockLecture);
      attendanceRepo.find.mockResolvedValue([
        { ...mockAttendance, status: AttendanceStatus.PRESENT, student: { studentId: 'S1', user: { fullNameEn: 'Ahmed' } } },
        { ...mockAttendance, status: AttendanceStatus.ABSENT, student: { studentId: 'S2', user: { fullNameEn: 'Mohamed' } } },
        { ...mockAttendance, status: AttendanceStatus.LATE, student: { studentId: 'S3', user: { fullNameEn: 'Ali' } } },
      ]);

      const result = await service.getLectureAttendance('lec-id-1');

      expect(result.totalStudents).toBe(3);
      expect(result.present).toBe(1);
      expect(result.absent).toBe(1);
      expect(result.late).toBe(1);
    });
  });
});
