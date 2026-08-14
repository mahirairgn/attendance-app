import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
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
      throw new ConflictException(`${label} sudah digunakan, silakan gunakan yang lain`);
    }
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    await this.checkUnique('email', createEmployeeDto.email);
    await this.checkUnique('employeeId', createEmployeeDto.employeeId);

    const newEmployee = this.employeeRepo.create({
      employeeId: createEmployeeDto.employeeId,
      fullName: createEmployeeDto.name,
      email: createEmployeeDto.email,
      password: await bcrypt.hash('Employee123!', 10),
      position: createEmployeeDto.position,
      division: createEmployeeDto.division,
      role: createEmployeeDto.role,
    });

    return this.employeeRepo.save(newEmployee);
  }

  findAll() {
    return this.employeeRepo.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} employee`;
  }

  findByEmail(email: string) {
    return this.employeeRepo.findOne({ where: { email }});
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.employeeRepo.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee dengan ID ${id} tidak ditemukan`);
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
