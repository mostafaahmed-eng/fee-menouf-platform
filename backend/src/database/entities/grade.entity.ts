import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Student } from './student.entity';
import { Course } from './course.entity';
import { Semester } from './semester.entity';
import { Doctor } from './doctor.entity';

export enum GradeComponent {
  MIDTERM = 'MIDTERM',
  FINAL = 'FINAL',
  COURSEWORK = 'COURSEWORK',
  LAB = 'LAB',
  TOTAL = 'TOTAL',
}

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: GradeComponent })
  component: GradeComponent;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'max_score' })
  maxScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.00 })
  weight: number;

  @Column({ type: 'boolean', default: false, name: 'is_published' })
  isPublished: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'timestamp', nullable: true, name: 'graded_at' })
  gradedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index()
  @Column({ name: 'student_id' })
  studentId: string;

  @Index(['studentId', 'courseId', 'semesterId'])

  @ManyToOne(() => Course, (course) => course.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Index()
  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Semester, (semester) => semester.grades)
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @Index()
  @Column({ name: 'semester_id' })
  semesterId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.grades)
  @JoinColumn({ name: 'graded_by' })
  gradedBy: Doctor;

  @Index()
  @Column({ name: 'graded_by', nullable: true })
  gradedById: string;
}
