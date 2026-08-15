import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button, Card, Divider, Empty, Spin, Tag, Typography, message } from 'antd';
import { CameraOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Link from 'antd/es/typography/Link';
import { viewAttendancePhoto } from '../lib/viewPhoto';

const { Text } = Typography;
const API_URL = 'http://localhost:3000';

interface Attendance {
  id: number;
  attendanceDate: string;
  clockInTime: string | null;
  clockOutTime: string | null;
}

interface TodayResponse {
  isWorkingDay: boolean;
  attendance: Attendance | null;
}

function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function formatDuration(seconds: number): string {
  if (seconds < 0) return '-';
  const jam = Math.floor(seconds / 3600);
  const menit = Math.floor((seconds % 3600) / 60);
  return `${jam} jam ${menit} menit`;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  const photoInputRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<'clock-in' | 'clock-out'>('clock-in');

  useEffect(() => {
    fetchToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Jam berjalan
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

      // Content-Type sengaja tidak di-set: browser yang isi otomatis beserta boundary-nya
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

  const status = !today?.isWorkingDay
    ? 'libur'
    : clockOut
      ? 'selesai'
      : clockIn
        ? 'bekerja'
        : 'belum';

  const durasi = clockIn
    ? formatDuration(
        (clockOut ? toSeconds(clockOut) : toSeconds(now.toTimeString().slice(0, 8))) -
          toSeconds(clockIn),
      )
    : null;

  const tanggal = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="dashboard">
      <div className="dashboard-clock">
        <Text type="secondary">{tanggal}</Text>
        <div className="dashboard-time">{now.toTimeString().slice(0, 8)}</div>

        {status === 'libur' && <Tag>Hari Libur</Tag>}
        {status === 'belum' && <Tag color="warning">Belum Clock In</Tag>}
        {status === 'bekerja' && <Tag color="processing">Sedang Bekerja</Tag>}
        {status === 'selesai' && <Tag color="success">Absensi Selesai</Tag>}
      </div>

      <Card styles={{ body: { padding: 24 } }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : status === 'libur' ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tidak ada shift hari ini. Selamat berlibur!"
          />
        ) : (
          <>
            <div className="dashboard-times">
              <div>
                <Text type="secondary">Clock In</Text>
                <div className={`dashboard-stamp ${clockIn ? '' : 'is-empty'}`}>
                  {clockIn ?? '--:--:--'}
                </div>
                {clockIn && <Link onClick={() => handleViewPhoto('clock-in')}>Lihat Foto</Link>}
              </div>

              <Divider orientation="vertical" style={{ height: 48 }} />

              <div>
                <Text type="secondary">Clock Out</Text>
                <div className={`dashboard-stamp ${clockOut ? '' : 'is-empty'}`}>
                  {clockOut ?? '--:--:--'}
                </div>
                {clockOut && <Link onClick={() => handleViewPhoto('clock-out')}>Lihat Foto</Link>}
              </div>
            </div>

            {durasi && (
              <div className="dashboard-duration">
                <Text type="secondary">Durasi kerja</Text>
                <Text strong>{durasi}</Text>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              {status === 'belum' && (
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

              {status === 'bekerja' && (
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

              {status === 'selesai' && (
                <div className="dashboard-done">
                  <CheckCircleFilled style={{ color: '#52c41a' }} />
                  <Text type="secondary">Absensi hari ini sudah lengkap</Text>
                </div>
              )}
            </div>

            {status !== 'selesai' && (
              <Text type="secondary" className="dashboard-hint">
                Kamu akan diminta mengambil foto sebelum absensi tersimpan.
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

export default DashboardPage;
