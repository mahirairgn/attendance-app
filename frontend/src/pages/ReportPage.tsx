import { useEffect, useState } from 'react';
import { DatePicker, Empty, Space, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const API_URL = 'http://localhost:3000';

type Status = 'holiday' | 'not_started' | 'in_progress' | 'completed' | 'absent';

interface ReportRecord {
  employeeId: string;
  fullName: string;
  position: string;
  division: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  clockInPhoto: string | null;
  clockOutPhoto: string | null;
  status: Status;
}

interface ReportResponse {
  date: string;
  isWorkingDay: boolean;
  records: ReportRecord[];
}

const STATUS_LABEL: Record<Status, string> = {
  holiday: 'Hari Libur',
  not_started: 'Belum Absen',
  in_progress: 'Belum Clock Out',
  completed: 'Absen Penuh',
  absent: 'Alpa',
};

const STATUS_COLOR: Record<Status, string> = {
  holiday: 'default',
  not_started: 'default',
  in_progress: 'processing',
  completed: 'success',
  absent: 'error',
};

const columns: ColumnsType<ReportRecord> = [
  { title: 'Name', dataIndex: 'fullName' },
  { title: 'ID', dataIndex: 'employeeId' },
  { title: 'Division', dataIndex: 'division' },
  {
    title: 'Clock In',
    dataIndex: 'clockInTime',
    render: (waktu: string | null) => waktu ?? '-',
  },
  {
    title: 'Clock Out',
    dataIndex: 'clockOutTime',
    render: (waktu: string | null) => waktu ?? '-',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    render: (status: Status) => <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>,
  },
];

function ReportPage() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function fetchReport(tanggal: string) {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/attendance/report?date=${tanggal}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengambil laporan absensi');
      }

      setReport(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gagal mengambil laporan absensi');
    } finally {
      setLoading(false);
    }
  }

  const records = report?.records ?? [];
  const sudahAbsen = records.filter((r) => r.clockInTime !== null).length;
  const belumAbsen = records.filter((r) => r.status === 'absent' || r.status === 'not_started').length;

  return (
    <div className="report-page">
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Employee Attendance Report
        </Title>
        <DatePicker
          value={dayjs(date)}
          allowClear={false}
          format="DD MMMM YYYY"
          onChange={(value) => value && setDate(value.format('YYYY-MM-DD'))}
        />
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <>
          {report?.isWorkingDay !== false && (
            <Space style={{ marginBottom: 16 }}>
              <Text type="secondary">Total karyawan aktif: {records.length}</Text>
              <Tag color="success">Sudah absen: {sudahAbsen}</Tag>
              <Tag color="error">Belum absen: {belumAbsen}</Tag>
            </Space>
          )}

          <Table
            rowKey="employeeId"
            columns={columns}
            dataSource={report?.isWorkingDay === false ? [] : records}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    report?.isWorkingDay === false
                      ? 'Hari ini libur, tidak ada jadwal absensi'
                      : 'Belum ada karyawan aktif'
                  }
                  style={{ padding: 24 }}
                />
              ),
            }}
          />
        </>
      )}
    </div>
  );
}

export default ReportPage;
