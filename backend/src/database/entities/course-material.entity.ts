import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Course } from './course.entity';
import { Doctor } from './doctor.entity';

export enum MaterialType {
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  DOC = 'DOC',
  LINK = 'LINK',
  OTHER = 'OTHER',
}

@Entity('course_materials')
export class CourseMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: MaterialType, default: MaterialType.PDF })
  type: MaterialType;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'boolean', default: true, name: 'is_published' })
  isPublished: boolean;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Course, (course) => course.materials)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'course_id' })
  courseId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.uploadedMaterials)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: Doctor;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedById: string;
}
