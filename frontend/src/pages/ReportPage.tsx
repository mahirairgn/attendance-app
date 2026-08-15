import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Empty, Image, Input, Modal, Row, Space, Spin, Statistic, Table, Tag, Typography, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { formatDuration, toSeconds } from '../lib/duration';
import { getAttendancePhotoUrl } from '../lib/viewPhoto';

const { Title, Text } = Typography;
const API_URL = 'http://localhost:3000';

type Status = 'holiday' | 'not_started' | 'in_progress' | 'completed' | 'missing_out' | 'absent';

interface ReportRecord {
  id: number | null;
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
  holiday: 'Holiday',
  not_started: 'Not Clocked In',
  in_progress: 'Clocked In',
  completed: 'Clocked Out',
  missing_out: 'Missing Clock Out',
  absent: 'Absent',
};

const STATUS_COLOR: Record<Status, string> = {
  holiday: 'default',
  not_started: 'default',
  in_progress: 'processing',
  completed: 'success',
  missing_out: 'warning',
  absent: 'error',
};

/** Dianggap "hadir": punya clock-in, terlepas udah clock-out, lupa clock-out, atau masih berlangsung. */
function isAttended(status: Status): boolean {
  return status === 'completed' || status === 'in_progress' || status === 'missing_out';
}

function ReportPage() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [detail, setDetail] = useState<ReportRecord | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [clockInPhoto, setClockInPhoto] = useState<string | null>(null);
  const [clockOutPhoto, setClockOutPhoto] = useState<string | null>(null);

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
        throw new Error(data.message || 'Failed to load attendance report');
      }

      setReport(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  }

  async function handleViewDetail(record: ReportRecord) {
    setDetail(record);
    setClockInPhoto(null);
    setClockOutPhoto(null);

    if (!record.id) return; // nggak ada attendance record -> nggak ada foto buat di-fetch

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

  const records = report?.records ?? [];
  const attended = records.filter((r) => isAttended(r.status)).length;
  const absent = records.filter((r) => r.status === 'absent').length;

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const query = search.trim().toLowerCase();
    return records.filter((r) => r.fullName.toLowerCase().includes(query));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, search]);

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
      title: 'Duration',
      key: 'duration',
      render: (_, record) =>
        record.clockInTime && record.clockOutTime
          ? formatDuration(toSeconds(record.clockOutTime) - toSeconds(record.clockInTime))
          : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: Status) => (
        <Tag color={STATUS_COLOR[status]} variant="outlined">
          {STATUS_LABEL[status]}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          disabled={!record.clockInTime}
          onClick={() => handleViewDetail(record)}
        >
          View Detail
        </Button>
      ),
    },
  ];

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
          disabledDate={(current) => !!current && current.isAfter(dayjs(), 'day')}
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
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card>
                  <Statistic title="Total Active Employees" value={records.length} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Attended" value={attended} valueStyle={{ color: '#3f8600' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic title="Absent" value={absent} valueStyle={{ color: '#cf1322' }} />
                </Card>
              </Col>
            </Row>
          )}

          {report?.isWorkingDay !== false && (
            <Input.Search
              placeholder="Search by employee name"
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 16 }}
            />
          )}

          <Table
            rowKey="employeeId"
            columns={columns}
            dataSource={report?.isWorkingDay === false ? [] : filteredRecords}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    report?.isWorkingDay === false
                      ? 'Today is a non-working day, no attendance required'
                      : 'No active employees found'
                  }
                  style={{ padding: 24 }}
                />
              ),
            }}
          />
        </>
      )}

      <Modal title="Attendance Detail" open={!!detail} onCancel={closeDetail} footer={null}>
        {detail && (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Name</Text>
              <div>{detail.fullName}</div>
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
                  <Tag color={STATUS_COLOR[detail.status]} variant="outlined">
                    {STATUS_LABEL[detail.status]}
                  </Tag>
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
                {!clockInPhoto && !clockOutPhoto && <Text type="secondary">No photo available</Text>}
              </Space>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}

export default ReportPage;
