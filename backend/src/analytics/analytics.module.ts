import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Student } from '../database/entities/student.entity';
import { Course } from '../database/entities/course.entity';
import { Grade } from '../database/entities/grade.entity';
import { CourseRegistration } from '../database/entities/course-registration.entity';
import { Attendance } from '../database/entities/attendance.entity';
import { Department } from '../database/entities/department.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { GpaHistory } from '../database/entities/gpa-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Course,
      Grade,
      CourseRegistration,
      Attendance,
      Department,
      Doctor,
      GpaHistory,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
