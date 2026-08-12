import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Attendance } from '../../attendance/entities/attendance.entity';

export enum EmployeeRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
}

@Entity('master_employee')
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column( {name: 'password_hash' })
  password!: string;

  @Column({ name: 'employee_id', unique: true })
  employeeId!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column()
  position!: string;

  @Column()
  division!: string;

  @Column({ type: 'enum', enum: EmployeeRole, default: EmployeeRole.EMPLOYEE })
  role!: EmployeeRole;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances!: Attendance[];
}
