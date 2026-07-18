import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User, Student, Doctor, Ta, Advisor, Department, Program, Course,
  Semester, AcademicYear, CourseRegistration, Attendance, Lecture,
  Grade, Exam, ExamSchedule, Classroom, Notification, AiConversation,
  Schedule, AuditLog, CourseMaterial, Announcement,
  Warning, GpaHistory, SystemSetting,
} from './entities';
import { FileEntity } from '../files/entities/file.entity';

const entities = [
  User, Student, Doctor, Ta, Advisor, Department, Program, Course,
  Semester, AcademicYear, CourseRegistration, Attendance, Lecture,
  Grade, Exam, ExamSchedule, Classroom, Notification, AiConversation,
  Schedule, AuditLog, CourseMaterial, Announcement,
  Warning, GpaHistory, SystemSetting, FileEntity,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<any>('database.logging') ?? ['error', 'schema'],
        autoLoadEntities: true,
        entities,
        retryAttempts: 10,
        retryDelay: 3000,
        extra: {
          max: configService.get<number>('database.poolMax') || 20,
          min: configService.get<number>('database.poolMin') || 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ...(configService.get<boolean>('database.sslEnabled')
            ? {
                ssl: {
                  rejectUnauthorized: true,
                  ca: configService.get<string>('database.sslCaPath'),
                },
              }
            : {}),
        },
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
