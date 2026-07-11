import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { Department } from './department.entity';
import { Student } from './student.entity';
import { Course } from './course.entity';

export enum Degree {
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  PHD = 'PHD',
}

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'name_ar' })
  nameAr: string;

  @Column({ type: 'varchar', length: 255, name: 'name_en' })
  nameEn: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'int', default: 4 })
  duration: number;

  @Column({ type: 'int', default: 160, name: 'total_credits' })
  totalCredits: number;

  @Column({ type: 'enum', enum: Degree, default: Degree.BACHELOR })
  degree: Degree;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.programs)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @OneToMany(() => Student, (student) => student.program)
  students: Student[];

  @OneToMany(() => Course, (course) => course.program)
  courses: Course[];
}
