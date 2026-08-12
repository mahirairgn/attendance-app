import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

@Entity('tr_attendance')
@Unique(['employee', 'attendanceDate'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Employee, (employee) => employee.attendances)
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'attendance_date', type: 'date' })
  attendanceDate!: string;

  @Column({ name: 'clock_in_time', type: 'time', nullable: true })
  clockInTime!: string | null;

  @Column({ name: 'clock_in_photo', type: 'varchar', nullable: true })
  clockInPhoto!: string | null;

  @Column({ name: 'clock_out_time', type: 'time', nullable: true })
  clockOutTime!: string | null;

  @Column({ name: 'clock_out_photo', type: 'varchar', nullable: true })
  clockOutPhoto!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
