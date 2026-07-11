import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { Course, Lecture, ExamSchedule, Exam, Classroom, Schedule } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Lecture, ExamSchedule, Exam, Classroom, Schedule])],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
