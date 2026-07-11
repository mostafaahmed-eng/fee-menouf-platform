import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';
import { Lecture } from './lecture.entity';
import { ExamSchedule } from './exam-schedule.entity';
import { CourseMaterial } from './course-material.entity';
import { Announcement } from './announcement.entity';
import { Grade } from './grade.entity';
import { Course } from './course.entity';

export enum DoctorTitle {
  PROFESSOR = 'PROFESSOR',
  ASSOCIATE = 'ASSOCIATE',
  ASSISTANT = 'ASSISTANT',
  LECTURER = 'LECTURER',
}

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'enum', enum: DoctorTitle, default: DoctorTitle.LECTURER })
  title: DoctorTitle;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'office_location' })
  officeLocation: string;

  @Column({ type: 'text', nullable: true, name: 'office_hours' })
  officeHours: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.doctor)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Department, (department) => department.doctors)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @OneToMany(() => Lecture, (lecture) => lecture.doctor)
  lectures: Lecture[];

  @OneToMany(() => ExamSchedule, (schedule) => schedule.invigilator)
  invigilatedExams: ExamSchedule[];

  @OneToMany(() => CourseMaterial, (material) => material.uploadedBy)
  uploadedMaterials: CourseMaterial[];

  @OneToMany(() => Announcement, (announcement) => announcement.doctor)
  announcements: Announcement[];

  @OneToMany(() => Grade, (grade) => grade.gradedBy)
  grades: Grade[];

  @OneToMany(() => Course, (course) => course.doctor)
  courses: Course[];
}
