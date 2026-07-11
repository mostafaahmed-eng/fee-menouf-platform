import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { CourseRegistration, Student, Course } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([CourseRegistration, Student, Course])],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
