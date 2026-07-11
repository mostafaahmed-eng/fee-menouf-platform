import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

export class GenerateQrDto {
  lectureId: string;
  expiryMinutes?: number;
}

export class ValidateQrDto {
  qrCode: string;
  studentId?: string;
}

@ApiTags('QR Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate QR code for lecture attendance' })
  async generateQr(@Body() dto: GenerateQrDto) {
    return this.qrService.generateLectureQr(dto.lectureId, dto.expiryMinutes || 10);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate QR code' })
  async validateQr(@Body() dto: ValidateQrDto) {
    return this.qrService.validateQr(dto.qrCode, dto.studentId);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Generate student ID QR card' })
  async generateStudentQr(@Param('studentId') studentId: string) {
    return this.qrService.generateStudentIdQr(studentId);
  }
}
