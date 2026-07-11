import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, ManyToMany, OneToMany, JoinTable, JoinColumn, Index
} from 'typeorm';
import { Department } from './department.entity';
import { Program } from './program.entity';
import { CourseRegistration } from './course-registration.entity';
import { Lecture } from './lecture.entity';
import { Grade } from './grade.entity';
import { Exam } from './exam.entity';
import { CourseMaterial } from './course-material.entity';
import { Announcement } from './announcement.entity';
import { Attendance } from './attendance.entity';
import { Doctor } from './doctor.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255, name: 'name_ar' })
  nameAr: string;

  @Column({ type: 'varchar', length: 255, name: 'name_en' })
  nameEn: string;

  @Column({ type: 'int' })
  credits: number;

  @Column({ type: 'int', default: 0, name: 'lecture_hours' })
  lectureHours: number;

  @Column({ type: 'int', default: 0, name: 'lab_hours' })
  labHours: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'semester_offered' })
  semesterOffered: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 100 })
  capacity: number;

  @Column({ type: 'int', default: 0, name: 'max_students' })
  maxStudents: number;

  @Index()
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.courses)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Program, (program) => program.courses)
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'program_id', nullable: true })
  programId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.id)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @ManyToMany(() => Course, (course) => course.prerequisites)
  @JoinTable({
    name: 'course_prerequisites',
    joinColumn: { name: 'course_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'prerequisite_id', referencedColumnName: 'id' },
  })
  prerequisites: Course[];

  @OneToMany(() => CourseRegistration, (registration) => registration.course)
  registrations: CourseRegistration[];

  @OneToMany(() => Lecture, (lecture) => lecture.course)
  lectures: Lecture[];

  @OneToMany(() => Grade, (grade) => grade.course)
  grades: Grade[];

  @OneToMany(() => Exam, (exam) => exam.course)
  exams: Exam[];

  @OneToMany(() => CourseMaterial, (material) => material.course)
  materials: CourseMaterial[];

  @OneToMany(() => Announcement, (announcement) => announcement.course)
  announcements: Announcement[];

  @OneToMany(() => Attendance, (attendance) => attendance.course)
  attendance: Attendance[];
}
