import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Exam } from '../database/entities/exam.entity';
import { ExamSchedule } from '../database/entities/exam-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamSchedule])],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
