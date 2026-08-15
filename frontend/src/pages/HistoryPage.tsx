import { Button, DatePicker, Empty, message, Space, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { getAttendancePhotoUrl } from "../lib/viewPhoto";
import { formatDuration, toSeconds } from '../lib/duration';
import { EyeOutlined } from "@ant-design/icons";
import AttendanceStatusTag from "../components/AttendanceStatusTag";
import AttendanceDetailModal from "../components/AttendanceDetailModal";
import { API_URL } from "../lib/api";

const { Title } = Typography;

interface Attendance {
  id: number;
  attendanceDate: string;
  clockInTime: string | null;
  clockOutTime: string | null;
}

/**
 * Status baris riwayat, disimpulkan dari data yang ada di baris itu sendiri
 * (tidak perlu backend). Baris yang tidak clock-in sama sekali tidak pernah
 * muncul di riwayat, jadi cuma 3 kondisi yang mungkin di sini.
 */
type RowStatus = 'completed' | 'in_progress' | 'missing_out';

function getRowStatus(record: Attendance): RowStatus | null {
  if (!record.clockInTime) return null;
  if (record.clockOutTime) return 'completed';
  return dayjs(record.attendanceDate).isSame(dayjs(), 'day') ? 'in_progress' : 'missing_out';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function HistoryPage() {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Dayjs | null>(dayjs());

  const [detail, setDetail] = useState<Attendance | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [clockInPhoto, setClockInPhoto] = useState<string | null>(null);
  const [clockOutPhoto, setClockOutPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/attendance/history`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load attendance history');
      }

      setHistory(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }

  const filteredHistory = useMemo(() => {
    if (!month) return history;
    return history.filter((item) => dayjs(item.attendanceDate).isSame(month, 'month'));
  }, [history, month]);

  async function handleViewDetail(record: Attendance) {
    setDetail(record);
    setClockInPhoto(null);
    setClockOutPhoto(null);
    setPhotoLoading(true);

    try {
      const [inUrl, outUrl] = await Promise.all([
        record.clockInTime ? getAttendancePhotoUrl(record.id, 'clock-in') : Promise.resolve(null),
        record.clockOutTime ? getAttendancePhotoUrl(record.id, 'clock-out') : Promise.resolve(null),
      ]);
      setClockInPhoto(inUrl);
      setClockOutPhoto(outUrl);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load photo');
    } finally {
      setPhotoLoading(false);
    }
  }

  function closeDetail() {
    setDetail(null);
    setClockInPhoto(null);
    setClockOutPhoto(null);
  }

  const columns: ColumnsType<Attendance> = [
    {
      title: 'Date',
      dataIndex: 'attendanceDate',
      render: (date: string) => formatDate(date),
    },
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
      key: 'status',
      render: (_, record) => {
        const status = getRowStatus(record);
        return status && <AttendanceStatusTag status={status} />;
      },
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) =>
        record.clockInTime && record.clockOutTime
          ? formatDuration(toSeconds(record.clockOutTime) - toSeconds(record.clockInTime))
          : '-',
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button size="small" onClick={() => handleViewDetail(record)} icon={<EyeOutlined />}>
          View Detail
        </Button>
      ),
    },
  ];

  const detailStatus = detail ? getRowStatus(detail) : null;

  return (
    <div className="history-page">
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          My Attendance History
        </Title>
        <DatePicker
          picker="month"
          value={month}
          onChange={setMonth}
          disabledDate={(current) => !!current && current.isAfter(dayjs(), 'month')}
          allowClear
          format="MMM YYYY"
        />
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredHistory}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No attendance logs recorded for this period"
                style={{ padding: 24 }}
              />
            ),
          }}
        />
      )}

      <AttendanceDetailModal
        open={!!detail}
        onClose={closeDetail}
        headerLabel="Date"
        headerValue={detail ? formatDate(detail.attendanceDate) : ''}
        clockInTime={detail?.clockInTime ?? null}
        clockOutTime={detail?.clockOutTime ?? null}
        status={detailStatus}
        clockInPhotoUrl={clockInPhoto}
        clockOutPhotoUrl={clockOutPhoto}
        photoLoading={photoLoading}
      />
    </div>
  )
}

export default HistoryPage;
