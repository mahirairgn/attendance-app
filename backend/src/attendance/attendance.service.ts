import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { EmployeesService } from '../employees/employees.service';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname, posix } from 'path';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    private readonly employeesService: EmployeesService
  ) {}

   private isWeekend(date: Date) {
    const day = date.getDay(); // 0 = Minggu, 6 = Sabtu
    // return day === 0 || day === 6;
    return day === 0; // For testing, hanya Minggu yang dianggap hari libur
  }


  private todayDateString(): string {
    const now = new Date(); // Timezone: UTC
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Timezone: UTC+7
  }
  
  async createClockIn(employeeId: number, file: Express.Multer.File) {
    if (this.isWeekend(new Date())) {
      throw new ConflictException("Gagal! Hari ini adalah hari libur");
    }

    const attendanceToday = (await this.getToday(employeeId)).attendance;
    if (attendanceToday) {
      throw new ConflictException("Gagal! Clock In hari ini sudah dilakukan")
    }

    const dir = './uploads/attendance/clockin';
    await mkdir(dir, { recursive: true });
    const filePath = posix.join(dir, `clockin-${Date.now()}${extname(file.originalname)}`);
    await writeFile(filePath, file.buffer);
      
    const clockIn = this.attendanceRepo.create({
      attendanceDate: this.todayDateString(),
      clockInTime: new Date().toTimeString().split(' ')[0],
      clockInPhoto: filePath,
      employee: { id: employeeId },
    })
    return this.attendanceRepo.save(clockIn);
  }

  async createClockOut(employeeId: number, file: Express.Multer.File) {
    if (this.isWeekend(new Date())) {
      throw new ConflictException("Gagal! Hari ini adalah hari libur");
    }

    const attendanceToday = (await this.getToday(employeeId)).attendance;
    if (!attendanceToday) {
      throw new NotFoundException("Gagal! Harap melakukan Clock In terlebih dahulu")
    }

    if (attendanceToday.clockOutTime) {
      throw new ConflictException("Gagal! Clock Out hari ini sudah dilakukan")
    }

    const dir = './uploads/attendance/clockout';
    await mkdir(dir, { recursive: true });
    const filePath = posix.join(dir, `clockout-${Date.now()}${extname(file.originalname)}`);
    await writeFile(filePath, file.buffer);

    attendanceToday.clockOutTime = new Date().toTimeString().split(' ')[0];
    attendanceToday.clockOutPhoto = filePath;
    return this.attendanceRepo.save(attendanceToday);
  }

  findAll() {
    return `This action returns all attendance`;
  }

  findOne(id: number) {
    return `This action returns a #${id} attendance`;
  }

  async getToday(employeeId: number) {
    if (this.isWeekend(new Date())) {
      return { isWorkingDay: false, attendance: null }
    }

    const todayAttendance = await this.attendanceRepo.findOne({
      where: { employee: { id: employeeId }, attendanceDate: this.todayDateString() }
    });
    
    return { isWorkingDay: true, attendance: todayAttendance }
  }

  async getHistory(employeeId: number) {
    return this.attendanceRepo.find({ 
      where: { 
        employee: { id: employeeId },
        attendanceDate: LessThanOrEqual(this.todayDateString())
      },
      order: { attendanceDate: 'DESC'}
    });
  }

  async getDailyReport(date?: string) {
    const reportDate = date ?? this.todayDateString();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
      throw new BadRequestException('Format tanggal harus YYYY-MM-DD');
    }

    // Employees punya data karyawan, Attendance punya data absensi.
    // Masing-masing diambil dari pemiliknya, lalu digabung di sini.
    const employees = await this.employeesService.findAllActive();

    const attendances = await this.attendanceRepo.find({
      where: { attendanceDate: reportDate },
      relations: { employee: true },
    });

    const byEmployeeId = new Map(attendances.map((a) => [a.employee.id, a]));

    const isHoliday = this.isWeekend(new Date(`${reportDate}T00:00:00`));

    const records = employees.map((employee) => {
      const record = byEmployeeId.get(employee.id) ?? null;

      let status: string;
      if (isHoliday) {
        status = 'Hari Libur';
      } else if (!record) {
        status = 'Tidak Hadir';
      } else if (record.clockOutTime) {
        status = 'Absen Penuh';
      } else {
        status = 'Belum Clock Out';
      }

      return {
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        position: employee.position,
        division: employee.division,
        clockInTime: record?.clockInTime ?? null,
        clockOutTime: record?.clockOutTime ?? null,
        clockInPhoto: record?.clockInPhoto ?? null,
        clockOutPhoto: record?.clockOutPhoto ?? null,
        status,
      };
    });

    return { date: reportDate, isWorkingDay: !isHoliday, records };
  }

  async getPhotoPath(
    id: number,
    type: 'clock-in' | 'clock-out',
    requester: { sub: number; role: string },
  ) {
    const attendance = await this.attendanceRepo.findOne({
      where: { id },
      relations: { employee: true },
    });

    if (!attendance) {
      throw new NotFoundException('Data absensi tidak ditemukan');
    }

    const isOwner = attendance.employee.id === requester.sub;
    if (!isOwner && requester.role !== 'admin') {
      throw new ForbiddenException('Tidak boleh mengakses foto absensi karyawan lain');
    }

    const photoPath = type === 'clock-in' ? attendance.clockInPhoto : attendance.clockOutPhoto;
    if (!photoPath) {
      throw new NotFoundException('Foto tidak ditemukan');
    }

    return photoPath;
  }

  update(id: number, updateAttendanceDto: UpdateAttendanceDto) {
    return `This action updates a #${id} attendance`;
  }

  remove(id: number) {
    return `This action removes a #${id} attendance`;
  }
}
