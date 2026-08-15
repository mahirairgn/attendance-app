import { Button, DatePicker, Empty, Image, message, Modal, Space, Spin, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { getAttendancePhotoUrl } from "../lib/viewPhoto";
import { formatDuration, toSeconds } from '../lib/duration';
import { EyeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const API_URL = 'http://localhost:3000';

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

function StatusTag({ status }: { status: RowStatus | null }) {
  if (status === 'completed') return <Tag color="success">Clocked Out</Tag>;
  if (status === 'in_progress') return <Tag color="processing">Clocked In</Tag>;
  if (status === 'missing_out') return <Tag color="warning">Missing Clock Out</Tag>;
  return <>-</>;
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
      render: (_, record) => <StatusTag status={getRowStatus(record)} />,
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

      <Modal
        title="Attendance Detail"
        open={!!detail}
        onCancel={closeDetail}
        footer={null}
      >
        {detail && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Date</Text>
              <div>{formatDate(detail.attendanceDate)}</div>
            </div>

            <Space size={48} wrap>
              <div>
                <Text type="secondary">Clock In</Text>
                <div>{detail.clockInTime ?? '-'}</div>
              </div>
              <div>
                <Text type="secondary">Clock Out</Text>
                <div>{detail.clockOutTime ?? '-'}</div>
              </div>
              <div>
                <Text type="secondary">Status</Text>
                <div>
                  <StatusTag status={detailStatus} />
                </div>
              </div>
              <div>
                <Text type="secondary">Duration</Text>
                <div>
                  {detail.clockInTime && detail.clockOutTime
                    ? formatDuration(toSeconds(detail.clockOutTime) - toSeconds(detail.clockInTime))
                    : '-'}
                </div>
              </div>
            </Space>

            {photoLoading ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spin />
              </div>
            ) : (
              <Space size={16}>
                {clockInPhoto && (
                  <div>
                    <Text type="secondary">Clock In Photo</Text>
                    <div>
                      <Image src={clockInPhoto} width={160} />
                    </div>
                  </div>
                )}
                {clockOutPhoto && (
                  <div>
                    <Text type="secondary">Clock Out Photo</Text>
                    <div>
                      <Image src={clockOutPhoto} width={160} />
                    </div>
                  </div>
                )}
                {!clockInPhoto && !clockOutPhoto && <Text type="secondary">No photos available</Text>}
              </Space>
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default HistoryPage;
