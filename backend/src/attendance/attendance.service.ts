import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as QRCode from 'qrcode';
import { Attendance, AttendanceStatus, AttendanceMethod, Lecture, LectureType } from '../database/entities';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { MarkAttendanceBatchDto } from './dto/mark-attendance-batch.dto';
import { QrAttendanceDto } from './dto/qr-attendance.dto';
import { GeolocationAttendanceDto } from './dto/geolocation-attendance.dto';
import {
  generateSignedQrPayload,
  encodeQrPayload,
  decodeQrPayload,
  verifyQrPayload,
} from './utils/qr-signer';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly usedNonces = new Map<string, number>();

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Lecture)
    private readonly lectureRepo: Repository<Lecture>,
  ) {
    setInterval(() => this.cleanupExpiredNonces(), 60 * 1000);
  }

  private cleanupExpiredNonces(): void {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.usedNonces) {
      if (now > expiresAt) {
        this.usedNonces.delete(nonce);
      }
    }
  }

  async markAttendance(dto: MarkAttendanceDto, markedBy?: string): Promise<Attendance> {
    const lecture = await this.lectureRepo.findOne({ where: { id: dto.lectureId } });
    if (!lecture) throw new NotFoundException('Lecture not found');

    const existing = await this.attendanceRepo.findOne({
      where: { studentId: dto.studentId, lectureId: dto.lectureId },
    });
    if (existing) throw new BadRequestException('Attendance already marked');

    const attendance = this.attendanceRepo.create({
      studentId: dto.studentId,
      courseId: dto.courseId,
      lectureId: dto.lectureId,
      status: dto.status,
      method: AttendanceMethod.MANUAL,
      date: new Date(),
      markedBy: markedBy,
    });

    const saved = await this.attendanceRepo.save(attendance);

    this.logger.log(`Attendance marked for student ${dto.studentId} in lecture ${dto.lectureId}`);

    return saved;
  }

  async markBulkAttendance(dto: MarkAttendanceBatchDto, markedBy?: string): Promise<{ marked: number; errors: { studentId: string; error: string }[] }> {
    let lecture = await this.lectureRepo.findOne({
      where: { courseId: dto.courseId },
      order: { createdAt: 'DESC' },
    });

    if (!lecture) {
      const now = new Date();
      lecture = this.lectureRepo.create({
        courseId: dto.courseId,
        dayOfWeek: now.getDay(),
        startTime: '08:00',
        endTime: '09:00',
        type: LectureType.LECTURE,
        title: `Lecture ${now.toISOString().split('T')[0]}`,
      });
      lecture = await this.lectureRepo.save(lecture);
    }

    let marked = 0;
    const errors: { studentId: string; error: string }[] = [];

    for (const record of dto.records) {
      try {
        const existing = await this.attendanceRepo.findOne({
          where: { studentId: record.studentId, lectureId: lecture.id },
        });
        if (existing) {
          errors.push({ studentId: record.studentId, error: 'Attendance already marked' });
          continue;
        }

        const attendance = this.attendanceRepo.create({
          studentId: record.studentId,
          courseId: dto.courseId,
          lectureId: lecture.id,
          status: record.status,
          method: AttendanceMethod.MANUAL,
          date: new Date(record.date),
          markedBy: markedBy,
        });

        await this.attendanceRepo.save(attendance);
        marked++;
      } catch (e: unknown) {
        errors.push({ studentId: record.studentId, error: e instanceof Error ? e.message : 'Unknown error' });
      }
    }

    this.logger.log(`Bulk attendance marked for course ${dto.courseId}: ${marked} records`);

    return { marked, errors };
  }

  async markQrAttendance(dto: QrAttendanceDto, studentId: string): Promise<Attendance> {
    const signedPayload = decodeQrPayload(dto.qrCode);

    const verification = verifyQrPayload(signedPayload);
    if (!verification.valid) {
      throw new ForbiddenException(verification.reason);
    }

    if (this.usedNonces.has(signedPayload.nonce)) {
      throw new BadRequestException('QR code has already been used');
    }

    const lecture = await this.lectureRepo.findOne({ where: { id: signedPayload.lectureId } });
    if (!lecture) throw new NotFoundException('Lecture not found');

    if (!lecture.qrCode || !lecture.qrExpiresAt) {
      throw new BadRequestException('No active QR code for this lecture');
    }

    const existing = await this.attendanceRepo.findOne({
      where: { studentId, lectureId: signedPayload.lectureId },
    });
    if (existing) throw new BadRequestException('Attendance already marked');

    this.usedNonces.set(signedPayload.nonce, signedPayload.expiresAt);

    const attendance = this.attendanceRepo.create({
      studentId,
      courseId: signedPayload.courseId,
      lectureId: signedPayload.lectureId,
      status: AttendanceStatus.PRESENT,
      method: AttendanceMethod.QR,
      date: new Date(),
    });

    const saved = await this.attendanceRepo.save(attendance);

    this.logger.log(`QR attendance marked for student ${studentId} in lecture ${signedPayload.lectureId}`);

    return saved;
  }

  async markGeolocationAttendance(dto: GeolocationAttendanceDto, studentId: string): Promise<Attendance> {
    const lecture = await this.lectureRepo.findOne({ where: { id: dto.lectureId } });
    if (!lecture) throw new NotFoundException('Lecture not found');

    if (!lecture.latitude || !lecture.longitude) {
      throw new BadRequestException('Lecture has no geolocation set');
    }

    const distance = this.calculateDistance(
      dto.latitude, dto.longitude,
      Number(lecture.latitude), Number(lecture.longitude),
    );

    const radiusKm = (lecture.geolocationRadius || 50) / 1000;
    if (distance > radiusKm) {
      throw new ForbiddenException(`You are ${Math.round(distance * 1000)}m away (max: ${lecture.geolocationRadius || 50}m)`);
    }

    const existing = await this.attendanceRepo.findOne({
      where: { studentId, lectureId: dto.lectureId },
    });
    if (existing) throw new BadRequestException('Attendance already marked');

    const attendance = this.attendanceRepo.create({
      studentId,
      courseId: lecture.courseId,
      lectureId: dto.lectureId,
      status: AttendanceStatus.PRESENT,
      method: AttendanceMethod.GEOLOCATION,
      date: new Date(),
      geolocation: { latitude: dto.latitude, longitude: dto.longitude },
    });

    const saved = await this.attendanceRepo.save(attendance);

    this.logger.log(`Geolocation attendance marked for student ${studentId} in lecture ${dto.lectureId}`);

    return saved;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return this.EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  async generateQrCode(lectureId: string): Promise<{ qrCode: string; expiresAt: Date }> {
    const lecture = await this.lectureRepo.findOne({ where: { id: lectureId } });
    if (!lecture) throw new NotFoundException('Lecture not found');

    const validMinutes = 5;
    const signedPayload = generateSignedQrPayload(lecture.id, lecture.courseId, validMinutes);
    const encoded = encodeQrPayload(signedPayload);
    const qrCodeDataUrl = await QRCode.toDataURL(encoded);
    const expiresAt = new Date(signedPayload.expiresAt);

    lecture.qrCode = encoded;
    lecture.qrExpiresAt = expiresAt;
    await this.lectureRepo.save(lecture);

    return { qrCode: qrCodeDataUrl, expiresAt };
  }

  async getStudentAttendance(studentId: string) {
    return this.attendanceRepo.find({
      where: { studentId },
      relations: ['lecture', 'course'],
      order: { date: 'DESC' },
    });
  }

  async getCourseAttendance(courseId: string) {
    return this.attendanceRepo.find({
      where: { courseId },
      relations: ['student', 'student.user', 'lecture'],
      order: { date: 'DESC' },
    });
  }

  async getLectureAttendance(lectureId: string) {
    const lecture = await this.lectureRepo.findOne({ where: { id: lectureId } });
    if (!lecture) throw new NotFoundException('Lecture not found');

    const records = await this.attendanceRepo.find({
      where: { lectureId },
      relations: ['student', 'student.user'],
      order: { date: 'DESC' },
    });

    return {
      lecture: { id: lecture.id, title: lecture.title, type: lecture.type, room: lecture.room },
      totalStudents: records.length,
      present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      absent: records.filter((r) => r.status === AttendanceStatus.ABSENT).length,
      late: records.filter((r) => r.status === AttendanceStatus.LATE).length,
      excused: records.filter((r) => r.status === AttendanceStatus.EXCUSED).length,
      records: records.map((r) => ({
        id: r.id,
        studentId: r.student.studentId,
        studentName: r.student.user.fullNameEn,
        status: r.status,
        method: r.method,
        date: r.date,
      })),
    };
  }

  async getAttendanceReport(courseId: string) {
    const records = await this.attendanceRepo.find({
      where: { courseId },
      relations: ['student', 'student.user', 'lecture'],
      order: { date: 'ASC' },
    });

    const lectures = await this.lectureRepo.find({ where: { courseId } });

    const studentMap = new Map<string, any>();
    for (const r of records) {
      if (!studentMap.has(r.studentId)) {
        studentMap.set(r.studentId, {
          name: r.student.user.fullNameEn,
          studentId: r.student.studentId,
          total: 0, present: 0, absent: 0, late: 0, excused: 0,
        });
      }
      const e = studentMap.get(r.studentId)!;
      e.total++;
      if (r.status === AttendanceStatus.PRESENT) e.present++;
      else if (r.status === AttendanceStatus.ABSENT) e.absent++;
      else if (r.status === AttendanceStatus.LATE) e.late++;
      else if (r.status === AttendanceStatus.EXCUSED) e.excused++;
    }

    const studentReports = Array.from(studentMap.values()).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0,
    }));

    return {
      courseId,
      totalLectures: lectures.length,
      lectures: lectures.map((l) => ({ id: l.id, title: l.title, type: l.type })),
      studentReports,
      summary: {
        totalStudents: studentReports.length,
        averageAttendance: studentReports.length > 0
          ? Math.round(studentReports.reduce((sum, s) => sum + s.percentage, 0) / studentReports.length)
          : 0,
        above75: studentReports.filter((s) => s.percentage >= 75).length,
        below75: studentReports.filter((s) => s.percentage < 75 && s.percentage >= 60).length,
        below60: studentReports.filter((s) => s.percentage < 60).length,
      },
    };
  }
}
