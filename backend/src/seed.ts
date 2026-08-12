import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, EmployeeRole } from './employees/entities/employee.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const repo: Repository<Employee> = app.get(getRepositoryToken(Employee));

  const accounts = [
    {
      email: 'admin@example.com',
      password: 'Admin123!',
      employeeId: 'EMP-001',
      fullName: 'Admin HRD',
      position: 'HR Manager',
      division: 'Human Resources',
      role: EmployeeRole.ADMIN,
    },
    {
      email: 'employee@example.com',
      password: 'Employee123!',
      employeeId: 'EMP-002',
      fullName: 'Budi Santoso',
      position: 'Software Engineer',
      division: 'Information Technology',
      role: EmployeeRole.EMPLOYEE,
    },
  ];

  for (const acc of accounts) {
    const existing = await repo.findOne({ where: { email: acc.email } });
    if (existing) {
      console.log(`Skip, sudah ada: ${acc.email}`);
      continue;
    }

    const employee = repo.create({
      ...acc,
      password: await bcrypt.hash(acc.password, 10),
    });
    await repo.save(employee);
    console.log(`Dibuat: ${acc.email} (password: ${acc.password})`);
  }

  await app.close();
}

seed();