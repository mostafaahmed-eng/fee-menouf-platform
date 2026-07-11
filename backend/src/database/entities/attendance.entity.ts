import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Student } from './student.entity';
import { Course } from './course.entity';
import { Lecture } from './lecture.entity';
import { Doctor } from './doctor.entity';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export enum AttendanceMethod {
  QR = 'QR',
  GEOLOCATION = 'GEOLOCATION',
  MANUAL = 'MANUAL',
}

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ type: 'enum', enum: AttendanceMethod, default: AttendanceMethod.MANUAL })
  method: AttendanceMethod;

  @Column({ type: 'jsonb', nullable: true })
  geolocation: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.attendance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index()
  @Column({ name: 'student_id' })
  studentId: string;

  @Index(['studentId', 'lectureId'])

  @ManyToOne(() => Course, (course) => course.attendance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Lecture, (lecture) => lecture.id)
  @JoinColumn({ name: 'lecture_id' })
  lecture: Lecture;

  @Column({ name: 'lecture_id', nullable: true })
  lectureId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.id)
  @JoinColumn({ name: 'marked_by' })
  markedByUser: Doctor;

  @Column({ name: 'marked_by', nullable: true })
  markedBy: string;
}
