import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, ManyToOne, JoinColumn, Index
} from 'typeorm';
import { User } from './user.entity';
import { Department } from './department.entity';
import { Doctor } from './doctor.entity';

@Entity('tas')
export class Ta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'employee_id' })
  employeeId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.ta)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Department, (department) => department.tas)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.id)
  @JoinColumn({ name: 'supervisor_doctor_id' })
  supervisorDoctor: Doctor;

  @Column({ name: 'supervisor_doctor_id', nullable: true })
  supervisorDoctorId: string;
}
