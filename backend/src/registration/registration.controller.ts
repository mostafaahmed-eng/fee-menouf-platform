import { Controller, Post, Get, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { RegisterCourseDto } from './dto/register-course.dto';
import { RejectRegistrationDto } from './dto/reject-registration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../database/entities';

@ApiTags('Registration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post('register')
  @Roles(UserRole.STUDENT, UserRole.ADVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register for courses with validation (prerequisites, credits, capacity, conflicts)' })
  @ApiResponse({ status: 201, description: 'Registration submitted' })
  register(@Body() dto: RegisterCourseDto, @CurrentUser('id') userId: string) {
    return this.registrationService.register(dto, userId);
  }

  @Post('drop/:id')
  @Roles(UserRole.STUDENT, UserRole.ADVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Drop a registered course' })
  drop(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationService.dropRegistration(id);
  }

  @Get('student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.ADVISOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all registrations for a student' })
  getStudentRegistrations(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.registrationService.getStudentRegistrations(studentId);
  }

  @Get('pending')
  @Roles(UserRole.ADVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all pending registrations for approval' })
  getPending() {
    return this.registrationService.getPendingRegistrations();
  }

  @Patch('approve/:id')
  @Roles(UserRole.ADVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a pending registration' })
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationService.approveRegistration(id);
  }

  @Patch('reject/:id')
  @Roles(UserRole.ADVISOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a pending registration with reason' })
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectRegistrationDto) {
    return this.registrationService.rejectRegistration(id, dto.reason);
  }
}
