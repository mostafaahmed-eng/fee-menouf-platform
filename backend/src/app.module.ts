import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { DepartmentsModule } from './departments/departments.module';
import { StudentsModule } from './students/students.module';
import { AcademicModule } from './academic/academic.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExamsModule } from './exams/exams.module';
import { GradesModule } from './grades/grades.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MaterialsModule } from './materials/materials.module';
import { ScheduleModule as TimetableModule } from './schedule/schedule.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FilesModule } from './files/files.module';
import { SearchModule } from './search/search.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { RegistrationModule } from './registration/registration.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ReportsModule } from './reports/reports.module';
import { QrModule } from './qr/qr.module';
import { HealthModule } from './health/health.module';
import { ProgramsModule } from './programs/programs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('app.rateLimitTtl') || 60000,
            limit: config.get<number>('app.rateLimitMax') || 100,
          },
        ],
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('app.redisHost') || 'localhost',
          port: config.get<number>('app.redisPort') || 6379,
          password: config.get<string>('app.redisPassword') || undefined,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    DepartmentsModule,
    StudentsModule,
    AcademicModule,
    AttendanceModule,
    ExamsModule,
    GradesModule,
    NotificationsModule,
    MaterialsModule,
    TimetableModule,
    AiModule,
    AnalyticsModule,
    FilesModule,
    SearchModule,
    SchedulingModule,
    RegistrationModule,
    ClassroomsModule,
    DoctorsModule,
    ReportsModule,
    QrModule,
    HealthModule,
    ProgramsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
