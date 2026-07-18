import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new student' })
  create(@Body() dto: CreateStudentDto, @CurrentUser('id') userId: string) {
    return this.studentsService.create(dto, userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.HEAD, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get all students' })
  findAll(@Query() query: StudentFilterDto) {
    return this.studentsService.findAll(query as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update student' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete student' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.remove(id);
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Get student grades' })
  getGrades(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.studentsService.getGrades(id, user);
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get student attendance' })
  getAttendance(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.studentsService.getAttendance(id, user);
  }

  @Get(':id/registrations')
  @ApiOperation({ summary: 'Get student registrations' })
  getRegistrations(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.studentsService.getRegistrations(id, user);
  }
}
