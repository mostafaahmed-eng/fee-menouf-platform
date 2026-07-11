import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';
import { Program } from './program.entity';
import { AcademicYear } from './academic-year.entity';
import { Semester } from './semester.entity';
import { CourseRegistration } from './course-registration.entity';
import { Attendance } from './attendance.entity';
import { Grade } from './grade.entity';
import { Warning } from './warning.entity';
import { GpaHistory } from './gpa-history.entity';

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  SUSPENDED = 'SUSPENDED',
  WITHDRAWN = 'WITHDRAWN',
}

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'student_id' })
  studentId: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'national_id' })
  nationalId: string;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'date', nullable: true, name: 'enrollment_date' })
  enrollmentDate: Date;

  @Column({ type: 'date', nullable: true, name: 'graduation_date' })
  graduationDate: Date;

  @Index()
  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status: StudentStatus;

  @Column({ type: 'int', default: 0, name: 'total_credits' })
  totalCredits: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.00 })
  gpa: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.00, name: 'cgpa' })
  cgpa: number;

  @Column({ type: 'int', default: 0, name: 'academic_warnings' })
  academicWarnings: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Department, (department) => department.students)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Program, (program) => program.students)
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'program_id', nullable: true })
  programId: string;

  @ManyToOne(() => AcademicYear, (academicYear) => academicYear.students)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'academic_year_id', nullable: true })
  academicYearId: string;

  @ManyToOne(() => Semester, (semester) => semester.students)
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;

  @Column({ name: 'semester_id', nullable: true })
  semesterId: string;

  @OneToMany(() => CourseRegistration, (registration) => registration.student)
  registrations: CourseRegistration[];

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendance: Attendance[];

  @OneToMany(() => Grade, (grade) => grade.student)
  grades: Grade[];

  @OneToMany(() => Warning, (warning) => warning.student)
  warnings: Warning[];

  @OneToMany(() => GpaHistory, (gpaHistory) => gpaHistory.student)
  gpaHistory: GpaHistory[];
}
