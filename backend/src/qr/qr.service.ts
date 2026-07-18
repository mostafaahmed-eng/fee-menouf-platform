import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { Student } from '../database/entities/student.entity';
import { Lecture } from '../database/entities/lecture.entity';
import {
  generateSignedQrPayload,
  encodeQrPayload,
  decodeQrPayload,
  verifyQrPayload,
} from '../attendance/utils/qr-signer';

interface QrCodeData {
  id: string;
  type: 'lecture_attendance' | 'student_id' | 'validation';
  data: any;
  expiresAt?: string;
}

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);
  private readonly qrSecrets = new Map<string, QrCodeData>();

  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Lecture)
    private readonly lectureRepo: Repository<Lecture>,
  ) {}

  async generateLectureQr(lectureId: string, expiryMinutes = 10): Promise<{ qrCode: string; qrImage: string }> {
    const lecture = await this.lectureRepo.findOne({
      where: { id: lectureId },
      relations: ['course'],
    });
    if (!lecture) throw new BadRequestException('Lecture not found');

    const signedPayload = generateSignedQrPayload(lecture.id, lecture.courseId, expiryMinutes);
    const encoded = encodeQrPayload(signedPayload);
    const qrImage = await QRCode.toDataURL(encoded);

    lecture.qrCode = encoded;
    lecture.qrExpiresAt = new Date(signedPayload.expiresAt);
    await this.lectureRepo.save(lecture);

    return { qrCode: signedPayload.nonce, qrImage };
  }

  async validateQr(qrCodeId: string, studentId?: string): Promise<{ valid: boolean; message: string; data?: any }> {
    const lecture = await this.lectureRepo.findOne({ where: { qrCode: qrCodeId } });
    if (lecture) {
      if (lecture.qrExpiresAt && new Date(lecture.qrExpiresAt) < new Date()) {
        return { valid: false, message: 'QR code has expired' };
      }

      try {
        const payload = decodeQrPayload(qrCodeId);
        const verification = verifyQrPayload(payload);
        if (!verification.valid) {
          return { valid: false, message: verification.reason || 'Invalid QR code' };
        }
        return {
          valid: true,
          message: 'QR code is valid',
          data: {
            lectureId: payload.lectureId,
            courseId: payload.courseId,
          },
        };
      } catch {
        return {
          valid: true,
          message: 'QR code is valid',
          data: {
            lectureId: lecture.id,
            courseId: lecture.courseId,
            startTime: lecture.startTime,
            endTime: lecture.endTime,
          },
        };
      }
    }

    const qrData = this.qrSecrets.get(qrCodeId);
    if (!qrData) {
      return { valid: false, message: 'Invalid QR code' };
    }

    if (qrData.expiresAt && new Date(qrData.expiresAt) < new Date()) {
      this.qrSecrets.delete(qrCodeId);
      return { valid: false, message: 'QR code has expired' };
    }

    if (qrData.type === 'lecture_attendance' && !studentId) {
      return { valid: true, message: 'QR code is valid, student ID required for attendance', data: qrData.data };
    }

    this.qrSecrets.delete(qrCodeId);
    return { valid: true, message: 'QR code validated successfully', data: qrData.data };
  }

  async generateStudentIdQr(studentId: string): Promise<{ qrImage: string; studentData: any }> {
    const student = await this.studentRepo.findOne({
      where: { studentId },
      relations: ['user', 'department'],
    });
    if (!student) throw new BadRequestException('Student not found');

    const qrData: QrCodeData = {
      id: uuidv4(),
      type: 'student_id',
      data: {
        studentId: student.studentId,
        name: student.user?.fullNameEn || '',
        department: student.department?.nameEn,
        level: student.level,
        email: student.user?.email,
      },
    };

    const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));
    return { qrImage, studentData: qrData.data };
  }
}
