import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Student } from './student.entity';
import { Course } from './course.entity';
import { Semester } from './semester.entity';

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DROPPED = 'DROPPED',
}

@Entity('course_registrations')
export class CourseRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.PENDING })
  status: RegistrationStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'registered_at' })
  registeredAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  grade: string;

  @Column({ type: 'int', default: 0 })
  credits: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.registrations, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index()
  @Column({ name: 'student_id' })
  studentId: string;

  @Index(['studentId', 'semesterId'])

  @ManyToOne(() => Course, (course) => course.registrations, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Index()
  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Semester, (semester) => semester.registrations, { eager: false })
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @Column({ name: 'semester_id' })
  semesterId: string;
}
