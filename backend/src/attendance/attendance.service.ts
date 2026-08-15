import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { EmployeesService } from '../employees/employees.service';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname, posix } from 'path';

export type AttendanceStatus =
  | 'off_day'
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'missing_out'
  | 'absent';

@Injectable()
export class AttendanceService {
  /** Jam pulang, dipakai buat nentuin kapan status boleh jadi ABSENT. Fixed untuk semua karyawan. */
  private readonly WORK_END_HOUR = 17;

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    private readonly employeesService: EmployeesService
  ) {}

   private isWeekend(date: Date) {
    const day = date.getDay(); // 0 = Minggu, 6 = Sabtu
    return day === 0 || day === 6;
  }


  private todayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** Tanggal yang sudah lewat: pasti sudah lewat jam pulang. Hari ini: cek jam sekarang. Masa depan: belum. */
  private isPastWorkHours(dateString: string): boolean {
    const today = this.todayDateString();
    if (dateString < today) return true;
    if (dateString > today) return false;
    return new Date().getHours() >= this.WORK_END_HOUR;
  }

  private computeStatus(params: {
    isOffDay: boolean;
    dateString: string;
    clockInTime: string | null;
    clockOutTime: string | null;
  }): AttendanceStatus {
    // Data absensi yang beneran ada harus menang duluan -- off_day cuma
    // fallback kalau emang nggak ada clock-in sama sekali buat tanggal itu.
    // (Skenario nyata: tanggal itu awalnya hari kerja pas orang clock-in,
    // terus aturan weekend berubah/dikoreksi belakangan.)
    if (params.clockOutTime) return 'completed';

    if (params.clockInTime) {
      const isPastDate = params.dateString < this.todayDateString();
      return isPastDate ? 'missing_out' : 'in_progress';
    }

    if (params.isOffDay) return 'off_day';

    if (this.isPastWorkHours(params.dateString)) return 'absent';
    return 'not_started';
  }

  async createClockIn(employeeId: number, file: Express.Multer.File) {
    if (this.isWeekend(new Date())) {
      throw new ConflictException("Failed! Today is a non-working day");
    }

    if (this.isPastWorkHours(this.todayDateString())) {
      throw new ConflictException("Failed! Today's working hours have already ended");
    }

    const attendanceToday = (await this.getToday(employeeId)).attendance;
    if (attendanceToday) {
      throw new ConflictException("Failed! You have already clocked in for today");
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
      throw new ConflictException("Failed! Today is a non-working day");
    }

    const attendanceToday = (await this.getToday(employeeId)).attendance;
    if (!attendanceToday) {
      throw new NotFoundException("Failed! Please clock in first before clocking out");
    }

    if (attendanceToday.clockOutTime) {
      throw new ConflictException("Failed! You have already clocked out for today")
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
    const dateString = this.todayDateString();
    const isOffDay = this.isWeekend(new Date());

    const todayAttendance = await this.attendanceRepo.findOne({
      where: { employee: { id: employeeId }, attendanceDate: dateString }
    });

    const status = this.computeStatus({
      isOffDay,
      dateString,
      clockInTime: todayAttendance?.clockInTime ?? null,
      clockOutTime: todayAttendance?.clockOutTime ?? null,
    });

    return { isWorkingDay: !isOffDay, attendance: todayAttendance, status };
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
      throw new BadRequestException('Date format must be YYYY-MM-DD');
    }

    // Employees punya data karyawan, Attendance punya data absensi.
    // Masing-masing diambil dari pemiliknya, lalu digabung di sini.
    const employees = await this.employeesService.findAllActive();

    const attendances = await this.attendanceRepo.find({
      where: { attendanceDate: reportDate },
      relations: { employee: true },
    });

    const byEmployeeId = new Map(attendances.map((a) => [a.employee.id, a]));

    const isOffDay = this.isWeekend(new Date(`${reportDate}T00:00:00`));

    const records = employees.map((employee) => {
      const record = byEmployeeId.get(employee.id) ?? null;

      const status = this.computeStatus({
        isOffDay,
        dateString: reportDate,
        clockInTime: record?.clockInTime ?? null,
        clockOutTime: record?.clockOutTime ?? null,
      });

      return {
        id: record?.id ?? null,
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

    return { date: reportDate, isWorkingDay: !isOffDay, records };
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
      throw new NotFoundException('Attendance record not found');
    }

    const isOwner = attendance.employee.id === requester.sub;
    if (!isOwner && requester.role !== 'admin') {
      throw new ForbiddenException("You are not allowed to access another employee's attendance photo");
    }

    const photoPath = type === 'clock-in' ? attendance.clockInPhoto : attendance.clockOutPhoto;
    if (!photoPath) {
      throw new NotFoundException('Photo not found');
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
