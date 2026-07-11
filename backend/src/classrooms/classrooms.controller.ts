import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ClassroomType } from '../database/entities';

@ApiTags('Classrooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classrooms')
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new classroom' })
  @ApiResponse({ status: 201, description: 'Classroom created' })
  create(@Body() dto: CreateClassroomDto) {
    return this.classroomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classrooms' })
  findAll() {
    return this.classroomsService.findAll();
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get classrooms by type' })
  findByType(@Param('type') type: ClassroomType) {
    return this.classroomsService.findByType(type);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get all available/active classrooms' })
  findAvailable() {
    return this.classroomsService.findAvailable();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get classroom by ID' })
  findOne(@Param('id') id: string) {
    return this.classroomsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update classroom' })
  update(@Param('id') id: string, @Body() dto: UpdateClassroomDto) {
    return this.classroomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete classroom' })
  remove(@Param('id') id: string) {
    return this.classroomsService.remove(id);
  }
}
