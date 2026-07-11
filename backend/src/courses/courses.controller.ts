import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UploadedFile, UseInterceptors, ParseUUIDPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { UploadMaterialDto } from './dto/upload-material.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../database/entities';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with optional filters' })
  findAll(@Query() filter?: CourseFilterDto) {
    return this.coursesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update course' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete course' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.remove(id);
  }

  @Get(':id/prerequisites')
  @ApiOperation({ summary: 'Get course prerequisites' })
  getPrerequisites(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getPrerequisites(id);
  }

  @Get(':id/students')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.ADVISOR)
  @ApiOperation({ summary: 'Get enrolled students' })
  getStudents(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getStudents(id);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get course schedule (lectures)' })
  getSchedule(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getSchedule(id);
  }

  @Post(':id/materials')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Upload course material' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMaterialDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.coursesService.uploadMaterial(id, dto, userId, file);
  }

  @Get(':id/materials')
  @ApiOperation({ summary: 'Get course materials' })
  getMaterials(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getMaterials(id);
  }

  @Post(':id/announcements')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create course announcement' })
  createAnnouncement(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateAnnouncementDto, @CurrentUser('id') userId: string) {
    return this.coursesService.createAnnouncement(id, dto, userId);
  }

  @Get(':id/announcements')
  @ApiOperation({ summary: 'Get course announcements' })
  getAnnouncements(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.getAnnouncements(id);
  }
}
