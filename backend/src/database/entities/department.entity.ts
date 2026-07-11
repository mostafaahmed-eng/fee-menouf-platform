import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index
} from 'typeorm';
import { Student } from './student.entity';
import { Doctor } from './doctor.entity';
import { Ta } from './ta.entity';
import { Advisor } from './advisor.entity';
import { Program } from './program.entity';
import { Course } from './course.entity';

export enum Faculty {
  FE_ELECTRONIC_ENGINEERING = 'FE_ELECTRONIC_ENGINEERING',
}

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'name_ar' })
  nameAr: string;

  @Column({ type: 'varchar', length: 255, name: 'name_en' })
  nameEn: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: Faculty, default: Faculty.FE_ELECTRONIC_ENGINEERING })
  faculty: Faculty;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'head_id' })
  headId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'contact_email' })
  contactEmail: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'contact_phone' })
  contactPhone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Student, (student) => student.department)
  students: Student[];

  @OneToMany(() => Doctor, (doctor) => doctor.department)
  doctors: Doctor[];

  @OneToMany(() => Ta, (ta) => ta.department)
  tas: Ta[];

  @OneToMany(() => Advisor, (advisor) => advisor.department)
  advisors: Advisor[];

  @OneToMany(() => Program, (program) => program.department)
  programs: Program[];

  @OneToMany(() => Course, (course) => course.department)
  courses: Course[];
}
