import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { AcademicYear } from './academic-year.entity';
import { Student } from './student.entity';
import { CourseRegistration } from './course-registration.entity';
import { Grade } from './grade.entity';
import { Exam } from './exam.entity';

export enum SemesterType {
  FALL = 'FALL',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
}

@Entity('semesters')
export class Semester {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'name_ar' })
  nameAr: string;

  @Column({ type: 'varchar', length: 255, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'enum', enum: SemesterType })
  type: SemesterType;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'date', nullable: true, name: 'registration_start' })
  registrationStart: Date;

  @Column({ type: 'date', nullable: true, name: 'registration_end' })
  registrationEnd: Date;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AcademicYear, (academicYear) => academicYear.semesters)
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'academic_year_id' })
  academicYearId: string;

  @OneToMany(() => Student, (student) => student.semester)
  students: Student[];

  @OneToMany(() => CourseRegistration, (registration) => registration.semester)
  registrations: CourseRegistration[];

  @OneToMany(() => Grade, (grade) => grade.semester)
  grades: Grade[];

  @OneToMany(() => Exam, (exam) => exam.semester)
  exams: Exam[];
}
