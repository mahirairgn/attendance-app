import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Repository } from 'typeorm';
import { Employee, EmployeeRole } from './entities/employee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>
  ) {}

  private async checkUnique(field: 'email' | 'employeeId', value: string, excludeId?: number) {
    const existing = await this.employeeRepo.findOne({ where: { [field]: value } });
    if (existing && existing.id !== excludeId) {
      const label = field === 'email' ? 'Email' : 'Employee ID (NIK)';
      throw new ConflictException(`${label} is already in use, please use another one`);
    }
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    await this.checkUnique('email', createEmployeeDto.email);
    await this.checkUnique('employeeId', createEmployeeDto.employeeId);

    const defaultPassword =
      createEmployeeDto.role === EmployeeRole.ADMIN ? 'Admin123!' : 'Employee123!';

    const newEmployee = this.employeeRepo.create({
      employeeId: createEmployeeDto.employeeId,
      fullName: createEmployeeDto.name,
      email: createEmployeeDto.email,
      password: await bcrypt.hash(defaultPassword, 10),
      position: createEmployeeDto.position,
      division: createEmployeeDto.division,
      role: createEmployeeDto.role,
    });

    return this.employeeRepo.save(newEmployee);
  }

  findAll() {
    return this.employeeRepo.find();
  }

  /** Karyawan aktif saja, urut by nama. Dipakai modul lain (mis. laporan absensi harian). */
  findAllActive() {
    return this.employeeRepo.find({
      where: { active: true },
      order: { fullName: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.employeeRepo.findOne({ where: { id } });
  }

  /** Dipakai login -- satu-satunya alasan sah butuh hash password ikut kebawa. */
  findByEmail(email: string) {
    return this.employeeRepo
      .createQueryBuilder('employee')
      .addSelect('employee.password')
      .where('employee.email = :email', { email })
      .getOne();
  }

  /** Dipakai alur ganti password -- butuh hash lama buat dicocokkan. */
  findOneWithPassword(id: number) {
    return this.employeeRepo
      .createQueryBuilder('employee')
      .addSelect('employee.password')
      .where('employee.id = :id', { id })
      .getOne();
  }

  async updatePassword(id: number, hashedPassword: string) {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    employee.password = hashedPassword;
    return this.employeeRepo.save(employee);
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (updateEmployeeDto.email) {
      await this.checkUnique('email', updateEmployeeDto.email, id);
    }
    if (updateEmployeeDto.employeeId) {
      await this.checkUnique('employeeId', updateEmployeeDto.employeeId, id);
    } 

    employee.email = updateEmployeeDto.email ?? employee.email;
    employee.employeeId = updateEmployeeDto.employeeId ?? employee.employeeId;
    employee.fullName = updateEmployeeDto.name ?? employee.fullName;
    employee.position = updateEmployeeDto.position ?? employee.position;
    employee.division = updateEmployeeDto.division ?? employee.division;
    employee.role = updateEmployeeDto.role ?? employee.role;
    employee.active = updateEmployeeDto.active ?? employee.active;
    return this.employeeRepo.save(employee);
  }

  remove(id: number) {
    return `This action removes a #${id} employee`;
  }
}
