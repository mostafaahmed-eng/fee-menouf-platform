import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CourseRegistration } from '../database/entities/course-registration.entity';
import { Attendance } from '../database/entities/attendance.entity';
import { Grade } from '../database/entities/grade.entity';
import { Student } from '../database/entities/student.entity';
import { Course } from '../database/entities/course.entity';
import { Department } from '../database/entities/department.entity';
import { Doctor } from '../database/entities/doctor.entity';
import { Semester } from '../database/entities/semester.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseRegistration,
      Attendance,
      Grade,
      Student,
      Course,
      Department,
      Doctor,
      Semester,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
