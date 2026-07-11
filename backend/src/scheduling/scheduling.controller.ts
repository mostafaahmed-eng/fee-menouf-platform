import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { GenerateLectureScheduleDto } from './dto/generate-lecture-schedule.dto';
import { GenerateExamScheduleDto } from './dto/generate-exam-schedule.dto';
import { AdjustScheduleDto } from './dto/adjust-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities';

@ApiTags('Scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('generate-lecture')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate lecture schedule using conflict-free algorithm' })
  @ApiResponse({ status: 201, description: 'Schedule generated' })
  generateLecture(@Body() dto: GenerateLectureScheduleDto) {
    return this.schedulingService.generateLectureSchedule(dto);
  }

  @Post('generate-exam')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate exam schedule' })
  generateExam(@Body() dto: GenerateExamScheduleDto) {
    return this.schedulingService.generateExamSchedule(dto);
  }

  @Get('lecture-schedule')
  @ApiOperation({ summary: 'Get generated lecture schedule' })
  getLectureSchedule() {
    return this.schedulingService.getLectureSchedule();
  }

  @Get('exam-schedule')
  @ApiOperation({ summary: 'Get generated exam schedule' })
  getExamSchedule() {
    return this.schedulingService.getExamSchedule();
  }

  @Get('classroom/:id/availability')
  @ApiOperation({ summary: 'Check classroom availability across week' })
  checkClassroomAvailability(@Param('id') id: string) {
    return this.schedulingService.checkClassroomAvailability(id);
  }

  @Patch('adjust/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually adjust a lecture schedule' })
  adjustSchedule(@Param('id') id: string, @Body() dto: AdjustScheduleDto) {
    return this.schedulingService.adjustSchedule(id, dto);
  }
}
