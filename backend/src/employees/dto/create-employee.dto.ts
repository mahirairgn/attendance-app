import { IsEmail, IsEnum, IsNotEmpty } from "class-validator";
import { EmployeeRole } from "../entities/employee.entity";

export class CreateEmployeeDto {
  @IsNotEmpty()
  employeeId!: string;
  
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  position!: string;

  @IsNotEmpty()
  division!: string;

  @IsEnum(EmployeeRole)
  role?: EmployeeRole;
}
