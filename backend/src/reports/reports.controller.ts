import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HEAD)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('registration/active')
  @ApiOperation({ summary: 'Get registration report for the active semester' })
  async getActiveRegistrationReport() {
    return this.reportsService.getActiveRegistrationReport();
  }

  @Get('registration/:semesterId')
  @ApiOperation({ summary: 'Get registration report for a semester' })
  async getRegistrationReport(@Param('semesterId') semesterId: string) {
    return this.reportsService.getRegistrationReport(semesterId);
  }

  @Get('attendance/:courseId')
  @ApiOperation({ summary: 'Get attendance report for a course' })
  async getAttendanceReport(@Param('courseId') courseId: string) {
    return this.reportsService.getAttendanceReport(courseId);
  }

  @Get('grades/:courseId')
  @ApiOperation({ summary: 'Get grade report for a course' })
  async getGradeReport(@Param('courseId') courseId: string) {
    return this.reportsService.getGradeReport(courseId);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get department statistics report' })
  async getDepartmentReport(@Param('departmentId') departmentId: string) {
    return this.reportsService.getDepartmentReport(departmentId);
  }

  @Get('export/:type')
  @ApiOperation({ summary: 'Export report as CSV or PDF' })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'pdf'] })
  async exportReport(
    @Param('type') type: string,
    @Query('format') format: 'csv' | 'pdf',
    @Res() res: Response,
  ) {
    const result = await this.reportsService.exportReport(type, format);
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    res.send(result.content);
  }
}
