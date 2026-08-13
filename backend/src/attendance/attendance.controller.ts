import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AuthGuard } from '@nestjs/passport';

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
      throw new BadRequestException('Foto wajib diupload');
    }
    return this.attendanceService.createClockIn(req.user.sub, file);
  }

  @Post('/clock-out')
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage() }),
  )
  clockOut(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Foto wajib diupload');
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
