import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { Course } from './course.entity';
import { Doctor } from './doctor.entity';
import { Attendance } from './attendance.entity';

export enum LectureType {
  LECTURE = 'LECTURE',
  LAB = 'LAB',
  TUTORIAL = 'TUTORIAL',
}

@Entity('lectures')
export class Lecture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', name: 'day_of_week' })
  dayOfWeek: number;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'enum', enum: LectureType, default: LectureType.LECTURE })
  type: LectureType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  group: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'week_pattern' })
  weekPattern: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true, name: 'qr_code' })
  qrCode: string;

  @Column({ type: 'timestamp', nullable: true, name: 'qr_expires_at' })
  qrExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.lectures)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Index()
  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.lectures)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @Column({ name: 'classroom_id', nullable: true })
  classroomId: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'int', default: 50, nullable: true, name: 'geolocation_radius' })
  geolocationRadius: number;

  @OneToMany(() => Attendance, (attendance) => attendance.lecture)
  attendance: Attendance[];
}
