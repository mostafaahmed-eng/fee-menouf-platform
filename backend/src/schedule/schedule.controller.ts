import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import { Schedule } from '../database/entities/schedule.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Schedule')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a schedule' })
  create(@Body() dto: Partial<Schedule>) {
    return this.scheduleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedules' })
  findAll(@Query() query: any) {
    return this.scheduleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update schedule' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<Schedule>) {
    return this.scheduleService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete schedule' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.remove(id);
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HEAD)
  @ApiOperation({ summary: 'Publish schedule' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.publish(id);
  }

  @Post(':id/archive')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Archive schedule' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.archive(id);
  }

  @Post('generate/lecture/:semesterId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate lecture schedule' })
  generateLecture(
    @Param('semesterId', ParseUUIDPipe) semesterId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.scheduleService.generateLectureSchedule(semesterId, departmentId);
  }

  @Post('generate/exam/:semesterId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Generate exam schedule' })
  generateExam(
    @Param('semesterId', ParseUUIDPipe) semesterId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.scheduleService.generateExamSchedule(semesterId, departmentId);
  }
}
