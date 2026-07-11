import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { Student } from '../database/entities/student.entity';
import { Lecture } from '../database/entities/lecture.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Lecture])],
  controllers: [QrController],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
