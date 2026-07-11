import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { AcademicYear } from '../database/entities/academic-year.entity';
import { Semester } from '../database/entities/semester.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Academic')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('years')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create academic year' })
  createYear(@Body() dto: Partial<AcademicYear>) {
    return this.academicService.createAcademicYear(dto);
  }

  @Get('years')
  @ApiOperation({ summary: 'Get all academic years' })
  findAllYears(@Query() query: any) {
    return this.academicService.findAllAcademicYears(query);
  }

  @Get('years/active')
  @ApiOperation({ summary: 'Get active academic year' })
  getActiveYear() {
    return this.academicService.getActiveAcademicYear();
  }

  @Get('years/:id')
  @ApiOperation({ summary: 'Get academic year by ID' })
  findYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.findAcademicYear(id);
  }

  @Patch('years/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update academic year' })
  updateYear(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<AcademicYear>) {
    return this.academicService.updateAcademicYear(id, dto);
  }

  @Delete('years/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete academic year' })
  removeYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.removeAcademicYear(id);
  }

  @Post('years/:id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set academic year as active' })
  activateYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.setActiveAcademicYear(id);
  }

  @Post('semesters')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create semester' })
  createSemester(@Body() dto: Partial<Semester>) {
    return this.academicService.createSemester(dto);
  }

  @Get('semesters')
  @ApiOperation({ summary: 'Get all semesters' })
  findAllSemesters(@Query() query: any) {
    return this.academicService.findAllSemesters(query);
  }

  @Get('semesters/active')
  @ApiOperation({ summary: 'Get active semester' })
  getActiveSemester() {
    return this.academicService.getActiveSemester();
  }

  @Get('semesters/:id')
  @ApiOperation({ summary: 'Get semester by ID' })
  findSemester(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.findSemester(id);
  }

  @Patch('semesters/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update semester' })
  updateSemester(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<Semester>) {
    return this.academicService.updateSemester(id, dto);
  }

  @Delete('semesters/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete semester' })
  removeSemester(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicService.removeSemester(id);
  }
}
