import { Empty, message, Space, Spin, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

const { Title } = Typography;
const API_URL = 'http://localhost:3000';

interface Attendance {
  id: number;
  attendanceDate: string;
  clockInTime: string | null;
  clockOutTime: string | null;
}

function HistoryPage() {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

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
        throw new Error(data.message || 'Gagal mengambil riwayat absensi');
      }

      setHistory(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Gagal mengambil riwayat absensi');
    } finally {
      setLoading(false);
    }
  }

  const columns: ColumnsType<Attendance> = [
    {
      title: 'Tanggal',
      dataIndex: 'attendanceDate',
      render: (tanggal: string) =>
        new Date(tanggal).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
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
  ];

  return (
    <div className="history-page">
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Riwayat Absensi
        </Title>
      </Space>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={history}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Belum ada riwayat absensi"
                style={{ padding: 24 }}
              />
            ),
          }}
        />
      )}
    </div>
  )
}

export default HistoryPage;