import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { EmployeesService } from 'src/employees/employees.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly employeesService: EmployeesService) {}

  async login(loginDto: LoginDto) {
    const user = await this.employeesService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException ("Email belum terdaftar. Harap hubungi Admin HR!")
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException ("Password salah!")
    }

    return user;
  }
}
