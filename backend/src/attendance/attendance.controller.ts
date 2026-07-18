import { Controller, Post, Get, Body, Param, UseGuards, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { MarkAttendanceBatchDto } from './dto/mark-attendance-batch.dto';
import { QrAttendanceDto } from './dto/qr-attendance.dto';
import { GeolocationAttendanceDto } from './dto/geolocation-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../database/entities';
import { StudentsService } from '../students/students.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly studentsService: StudentsService,
  ) {}

  @Post('mark')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually mark attendance for a student' })
  @ApiResponse({ status: 201, description: 'Attendance marked' })
  markAttendance(@Body() dto: MarkAttendanceDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.markAttendance(dto, userId);
  }

  @Post('mark-bulk')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark attendance for multiple students in a lecture (auto-creates lecture if needed)' })
  @ApiResponse({ status: 201, description: 'Attendance marked' })
  markBulkAttendance(@Body() dto: MarkAttendanceBatchDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.markBulkAttendance(dto, userId);
  }

  @Post('qr')
  @Roles(UserRole.STUDENT, UserRole.DOCTOR, UserRole.TA)
  @ApiOperation({ summary: 'Mark attendance using QR code' })
  markQrAttendance(@Body() dto: QrAttendanceDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.markQrAttendance(dto, userId);
  }

  @Post('geolocation')
  @Roles(UserRole.STUDENT, UserRole.DOCTOR, UserRole.TA)
  @ApiOperation({ summary: 'Mark attendance using GPS geolocation' })
  markGeolocationAttendance(@Body() dto: GeolocationAttendanceDto, @CurrentUser('id') userId: string) {
    return this.attendanceService.markGeolocationAttendance(dto, userId);
  }

  @Post('generate-qr/:lectureId')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate QR code for a lecture' })
  generateQr(@Param('lectureId', ParseUUIDPipe) lectureId: string) {
    return this.attendanceService.generateQrCode(lectureId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN, UserRole.ADVISOR)
  @ApiOperation({ summary: 'Get attendance records for a student' })
  async getStudentAttendance(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() currentUser: { id: string; role: UserRole },
  ) {
    if (currentUser.role === UserRole.STUDENT) {
      const student = await this.studentsService.findByUserId(currentUser.id);
      if (!student || student.id !== studentId) {
        throw new ForbiddenException('You can only view your own attendance');
      }
    }
    return this.attendanceService.getStudentAttendance(studentId);
  }

  @Get('course/:courseId')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get attendance records for a course' })
  getCourseAttendance(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.attendanceService.getCourseAttendance(courseId);
  }

  @Get('lecture/:lectureId')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get attendance list for a lecture' })
  getLectureAttendance(@Param('lectureId', ParseUUIDPipe) lectureId: string) {
    return this.attendanceService.getLectureAttendance(lectureId);
  }

  @Get('report/:courseId')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get comprehensive attendance report for a course' })
  getAttendanceReport(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.attendanceService.getAttendanceReport(courseId);
  }
}
