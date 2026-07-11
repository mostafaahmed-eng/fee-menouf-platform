import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { Exam } from './exam.entity';
import { Classroom } from './classroom.entity';
import { Doctor } from './doctor.entity';

@Entity('exam_schedules')
export class ExamSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', name: 'start_time' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time' })
  endTime: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  section: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  group: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Exam, (exam) => exam.schedules)
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'exam_id' })
  examId: string;

  @ManyToOne(() => Classroom, (classroom) => classroom.examSchedules)
  @JoinColumn({ name: 'classroom_id' })
  classroom: Classroom;

  @Column({ name: 'classroom_id', nullable: true })
  classroomId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.invigilatedExams)
  @JoinColumn({ name: 'invigilator_id' })
  invigilator: Doctor;

  @Column({ name: 'invigilator_id', nullable: true })
  invigilatorId: string;
}
