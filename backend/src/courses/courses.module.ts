import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course, CourseMaterial, Announcement } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseMaterial, Announcement])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
