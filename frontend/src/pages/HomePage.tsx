import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button, Card, Divider, Empty, Spin, Tag, Typography, message } from 'antd';
import { CameraOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Link from 'antd/es/typography/Link';
import { viewAttendancePhoto } from '../lib/viewPhoto';
import { formatDuration, toSeconds } from '../lib/duration';

const { Text } = Typography;
const API_URL = 'http://localhost:3000';

type AttendanceStatus = 'holiday' | 'not_started' | 'in_progress' | 'completed' | 'absent';

interface Attendance {
  id: number;
  attendanceDate: string;
  clockInTime: string | null;
  clockOutTime: string | null;
}

interface TodayResponse {
  isWorkingDay: boolean;
  attendance: Attendance | null;
  status: AttendanceStatus;
}

function HomePage() {
  const navigate = useNavigate();
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  const photoInputRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<'clock-in' | 'clock-out'>('clock-in');

  useEffect(() => {
    fetchToday();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchToday() {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/attendance/today`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        navigate('/login', { replace: true });
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengambil data absensi hari ini');
      }

      setToday(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  }

  function pickPhoto(action: 'clock-in' | 'clock-out') {
    actionRef.current = action;
    photoInputRef.current?.click();
  }

  async function handleViewPhoto(type: 'clock-in' | 'clock-out') {
    if (!attendance) return;

    try {
      await viewAttendancePhoto(attendance.id, type);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gagal memuat foto');
    }
  }

  async function handlePhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset biar file yang sama bisa dipilih lagi
    if (!file) return;

    const action = actionRef.current;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${API_URL}/attendance/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan absensi');
      }

      message.success(action === 'clock-in' ? 'Clock In berhasil' : 'Clock Out berhasil');
      await fetchToday();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gagal menyimpan absensi');
    } finally {
      setSubmitting(false);
    }
  }

  const attendance = today?.attendance ?? null;
  const clockIn = attendance?.clockInTime ?? null;
  const clockOut = attendance?.clockOutTime ?? null;
  const status = today?.status;

  const duration = clockIn
    ? formatDuration(
        (clockOut ? toSeconds(clockOut) : toSeconds(now.toTimeString().slice(0, 8))) -
          toSeconds(clockIn),
      )
    : null;

  const date = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="home">
      <div className="home-clock">
        <Text type="secondary">{date}</Text>
        <div className="home-time">{now.toTimeString().slice(0, 8)}</div>

        {status === 'holiday' && <Tag variant="outlined">Holiday</Tag>}
        {status === 'not_started' && <Tag color="warning" variant="outlined">Not Clocked In</Tag>}
        {status === 'in_progress' && <Tag color="processing" variant="outlined">Clocked In</Tag>}
        {status === 'completed' && <Tag color="success" variant="outlined">Clocked Out</Tag>}
        {status === 'absent' && <Tag color="error" variant="outlined">Absent</Tag>}
      </div>

      <Card styles={{ body: { padding: 24 } }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : status === 'holiday' ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="There is no shift scheduled for today. Have a great day off!"
          />
        ) : status === 'absent' ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="You have not recorded your attendance for today."
          />
        ) : (
          <>
            <div className="home-times">
              <div>
                <Text type="secondary">Clock In</Text>
                <div className={`home-stamp ${clockIn ? '' : 'is-empty'}`}>
                  {clockIn ?? '--:--:--'}
                </div>
                {clockIn && <Link onClick={() => handleViewPhoto('clock-in')}> View Photo</Link>}
              </div>

              <Divider orientation="vertical" style={{ height: 48 }} />

              <div>
                <Text type="secondary">Clock Out</Text>
                <div className={`home-stamp ${clockOut ? '' : 'is-empty'}`}>
                  {clockOut ?? '--:--:--'}
                </div>
                {clockOut && <Link onClick={() => handleViewPhoto('clock-out')}>View Photo</Link>}
              </div>
            </div>

            {duration && (
              <div className="home-duration">
                <Text type="secondary">Work Duration</Text>
                <Text strong>{duration}</Text>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              {status === 'not_started' && (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CameraOutlined />}
                  loading={submitting}
                  onClick={() => pickPhoto('clock-in')}
                >
                  Clock In
                </Button>
              )}

              {status === 'in_progress' && (
                <Button
                  type="primary"
                  danger
                  size="large"
                  block
                  icon={<CameraOutlined />}
                  loading={submitting}
                  onClick={() => pickPhoto('clock-out')}
                >
                  Clock Out
                </Button>
              )}

              {status === 'completed' && (
                <div className="home-done">
                  <CheckCircleFilled style={{ color: '#52c41a' }} />
                  <Text type="secondary">Your attendance for today is complete</Text>
                </div>
              )}
            </div>

            {status !== 'completed' && (
              <Text type="secondary" className="home-hint">
                You will need to upload a photo to record your attendance.
              </Text>
            )}
          </>
        )}
      </Card>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={handlePhotoSelected}
      />
    </div>
  );
}

export default HomePage;
