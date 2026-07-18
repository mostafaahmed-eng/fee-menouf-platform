import { Controller, Post, Get, Patch, Body, Param, UseGuards, ParseUUIDPipe, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { BulkGradeDto } from './dto/bulk-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../database/entities';
import { StudentsService } from '../students/students.service';

@ApiTags('Grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(
    private readonly gradesService: GradesService,
    private readonly studentsService: StudentsService,
  ) {}

  @Post()
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Enter a grade component for a student' })
  @ApiResponse({ status: 201, description: 'Grade created' })
  create(@Body() dto: CreateGradeDto) {
    return this.gradesService.create(dto);
  }

  @Post('bulk')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk grade entry for multiple students/components' })
  createBulk(@Body() dto: BulkGradeDto) {
    return this.gradesService.createBulk(dto);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a grade component (only if not published)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGradeDto) {
    return this.gradesService.update(id, dto);
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.DOCTOR, UserRole.ADMIN, UserRole.ADVISOR)
  @ApiOperation({ summary: 'Get all grade components for a student' })
  async getStudentGrades(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() currentUser: { id: string; role: UserRole },
  ) {
    if (currentUser.role === UserRole.STUDENT) {
      const student = await this.studentsService.findByUserId(currentUser.id);
      if (!student || student.id !== studentId) {
        throw new ForbiddenException('You can only view your own grades');
      }
    }
    return this.gradesService.getStudentGrades(studentId);
  }

  @Get('course/:courseId')
  @Roles(UserRole.DOCTOR, UserRole.TA, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get published grades for a course' })
  getCourseGrades(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.gradesService.getCourseGrades(courseId);
  }

  @Post('publish/:courseId')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish all unpublished grades for a course' })
  publishGrades(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.gradesService.publishGrades(courseId);
  }

  @Get('transcript/:studentId')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.ADVISOR)
  @ApiOperation({ summary: 'Get full transcript for a student' })
  async getTranscript(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() currentUser: { id: string; role: UserRole },
  ) {
    if (currentUser.role === UserRole.STUDENT) {
      const student = await this.studentsService.findByUserId(currentUser.id);
      if (!student || student.id !== studentId) {
        throw new ForbiddenException('You can only view your own transcript');
      }
    }
    return this.gradesService.getStudentTranscript(studentId);
  }
}
