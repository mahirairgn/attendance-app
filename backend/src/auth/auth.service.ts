import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmployeesService } from 'src/employees/employees.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.employeesService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException ("Email is not registered. Please contact your HR Admin!")
    }

    if (!user.active) {
      throw new UnauthorizedException ("This account is no longer active. Please contact your HR Admin!")
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException ("Wrong password!")
    }

    const payload = { sub: user.id, email: user.email, role: user.role }

    return {
      access_token: await this.jwtService.signAsync(payload),
      message: "Login success!"
    };
  }

  async resetPassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.employeesService.findOneWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password!');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.employeesService.updatePassword(userId, hashed);

    return { message: 'Password updated successfully' };
  }
}
