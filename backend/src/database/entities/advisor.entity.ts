import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';

@Entity('advisors')
export class Advisor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'text', nullable: true, name: 'office_hours' })
  officeHours: string;

  @Column({ type: 'int', default: 0, name: 'max_students' })
  maxStudents: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.advisor)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Department, (department) => department.advisors)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;
}
