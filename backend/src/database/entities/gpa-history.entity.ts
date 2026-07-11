import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Student } from './student.entity';
import { Semester } from './semester.entity';

@Entity('gpa_history')
export class GpaHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, name: 'semester_gpa' })
  semesterGpa: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  cgpa: number;

  @Column({ type: 'int', default: 0, name: 'total_credits' })
  totalCredits: number;

  @Column({ type: 'int', default: 0, name: 'earned_credits' })
  earnedCredits: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.gpaHistory)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Semester, (semester) => semester.id)
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @Column({ name: 'semester_id' })
  semesterId: string;
}
