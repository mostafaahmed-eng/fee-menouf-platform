import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { Course } from './course.entity';
import { Semester } from './semester.entity';
import { ExamSchedule } from './exam-schedule.entity';

export enum ExamType {
  MIDTERM = 'MIDTERM',
  FINAL = 'FINAL',
  QUIZ = 'QUIZ',
  PRACTICAL = 'PRACTICAL',
}

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ExamType })
  type: ExamType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'total_marks' })
  totalMarks: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.exams)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Semester, (semester) => semester.exams)
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @Column({ name: 'semester_id' })
  semesterId: string;

  @OneToMany(() => ExamSchedule, (schedule) => schedule.exam)
  schedules: ExamSchedule[];
}
