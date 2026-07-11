import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { AcademicYear } from '../database/entities/academic-year.entity';
import { Semester } from '../database/entities/semester.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicYear, Semester])],
  controllers: [AcademicController],
  providers: [AcademicService],
  exports: [AcademicService],
})
export class AcademicModule {}
