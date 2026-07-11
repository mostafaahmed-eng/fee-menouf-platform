import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get student analytics (GPA trends, attendance trends)' })
  async getStudentAnalytics(@Param('studentId') studentId: string) {
    return this.analyticsService.getStudentAnalytics(studentId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get course analytics (performance, failure rates)' })
  async getCourseAnalytics(@Param('courseId') courseId: string) {
    return this.analyticsService.getCourseAnalytics(courseId);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get department analytics' })
  async getDepartmentAnalytics(@Param('departmentId') departmentId: string) {
    return this.analyticsService.getDepartmentAnalytics(departmentId);
  }

  @Get('enrollment-trends')
  @ApiOperation({ summary: 'Get enrollment trends over time' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getEnrollmentTrends(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getEnrollmentTrends(startDate, endDate);
  }

  @Get('graduation-stats')
  @ApiOperation({ summary: 'Get graduation statistics' })
  async getGraduationStats() {
    return this.analyticsService.getGraduationStats();
  }

  @Get('failure-rates')
  @ApiOperation({ summary: 'Get course failure rate analysis' })
  async getFailureRates() {
    return this.analyticsService.getFailureRates();
  }

  @Get('faculty-workload')
  @ApiOperation({ summary: 'Get faculty workload distribution' })
  async getFacultyWorkload() {
    return this.analyticsService.getFacultyWorkload();
  }
}
