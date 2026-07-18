import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiConversation } from '../database/entities/ai-conversation.entity';
import { StudentsModule } from '../students/students.module';
import { GradesModule } from '../grades/grades.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { RegistrationModule } from '../registration/registration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation]),
    StudentsModule,
    GradesModule,
    AttendanceModule,
    RegistrationModule,
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
