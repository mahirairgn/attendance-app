import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Res, UseInterceptors, UploadedFile, BadRequestException, Query, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { createReadStream } from 'fs';
import { extname } from 'path';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmployeeRole } from '../employees/entities/employee.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('/clock-in')
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage() }),
  )
  clockIn(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }
    return this.attendanceService.createClockIn(req.user.sub, file);
  }

  @Post('/clock-out')
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage() }),
  )
  clockOut(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }
    return this.attendanceService.createClockOut(req.user.sub, file);
  }

  @Get()
  findAll() {
    return this.attendanceService.findAll();
  }

  @Get('/today')
  getToday(@Req() req) {
    return this.attendanceService.getToday(req.user.sub);
  }

  @Get('/history')
  getHistory(@Req() req) {
    return this.attendanceService.getHistory(req.user.sub);
  }

  @UseGuards(RolesGuard)
  @Roles(EmployeeRole.ADMIN)
  @Get('/report')
  getDailyReport(@Query('date') date?: string) {
    return this.attendanceService.getDailyReport(date);
  }

  @Get(':id/photo/:type')
  async getPhoto(
    @Param('id') id: string,
    @Param('type') type: 'clock-in' | 'clock-out',
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (type !== 'clock-in' && type !== 'clock-out') {
      throw new BadRequestException('Invalid photo type');
    }

    const filePath = await this.attendanceService.getPhotoPath(+id, type, req.user);
    const mime = extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    res.set({ 'Content-Type': mime });
    return new StreamableFile(createReadStream(filePath));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendanceService.findOne(+id);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    return this.attendanceService.update(+id, updateAttendanceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(+id);
  }
}
