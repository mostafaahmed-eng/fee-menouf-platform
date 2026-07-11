import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { Exam } from '../database/entities/exam.entity';
import { ExamSchedule } from '../database/entities/exam-schedule.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HEAD, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create an exam' })
  create(@Body() dto: Partial<Exam>) {
    return this.examsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all exams' })
  findAll(@Query() query: any) {
    return this.examsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exam by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HEAD)
  @ApiOperation({ summary: 'Update exam' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<Exam>) {
    return this.examsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete exam' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.remove(id);
  }

  @Post(':examId/schedules')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HEAD)
  @ApiOperation({ summary: 'Create exam schedule' })
  createSchedule(
    @Param('examId', ParseUUIDPipe) examId: string,
    @Body() dto: Partial<ExamSchedule>,
  ) {
    return this.examsService.createSchedule({ ...dto, examId });
  }

  @Get(':examId/schedules')
  @ApiOperation({ summary: 'Get exam schedules' })
  findSchedules(@Param('examId', ParseUUIDPipe) examId: string) {
    return this.examsService.findSchedules(examId);
  }

  @Delete('schedules/:scheduleId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete exam schedule' })
  removeSchedule(@Param('scheduleId', ParseUUIDPipe) scheduleId: string) {
    return this.examsService.removeSchedule(scheduleId);
  }
}
