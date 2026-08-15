import { Image, Modal, Space, Spin, Typography } from 'antd';
import AttendanceStatusTag, { type AttendanceStatus } from './AttendanceStatusTag';
import { formatDuration, toSeconds } from '../lib/duration';

const { Text } = Typography;

interface AttendanceDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** Label baris pertama, mis. "Date" (History) atau "Name" (Report). */
  headerLabel: string;
  headerValue: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: AttendanceStatus | null;
  clockInPhotoUrl: string | null;
  clockOutPhotoUrl: string | null;
  photoLoading: boolean;
}

function AttendanceDetailModal({
  open,
  onClose,
  headerLabel,
  headerValue,
  clockInTime,
  clockOutTime,
  status,
  clockInPhotoUrl,
  clockOutPhotoUrl,
  photoLoading,
}: AttendanceDetailModalProps) {
  return (
    <Modal title="Attendance Detail" open={open} onCancel={onClose} footer={null}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Text type="secondary">{headerLabel}</Text>
          <div>{headerValue}</div>
        </div>

        <Space size={48} wrap>
          <div>
            <Text type="secondary">Clock In</Text>
            <div>{clockInTime ?? '-'}</div>
          </div>
          <div>
            <Text type="secondary">Clock Out</Text>
            <div>{clockOutTime ?? '-'}</div>
          </div>
          <div>
            <Text type="secondary">Status</Text>
            <div>{status && <AttendanceStatusTag status={status} />}</div>
          </div>
          <div>
            <Text type="secondary">Duration</Text>
            <div>
              {clockInTime && clockOutTime
                ? formatDuration(toSeconds(clockOutTime) - toSeconds(clockInTime))
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
            {clockInPhotoUrl && (
              <div>
                <Text type="secondary">Clock In Photo</Text>
                <div>
                  <Image src={clockInPhotoUrl} width={160} />
                </div>
              </div>
            )}
            {clockOutPhotoUrl && (
              <div>
                <Text type="secondary">Clock Out Photo</Text>
                <div>
                  <Image src={clockOutPhotoUrl} width={160} />
                </div>
              </div>
            )}
            {!clockInPhotoUrl && !clockOutPhotoUrl && (
              <Text type="secondary">No photo available</Text>
            )}
          </Space>
        )}
      </Space>
    </Modal>
  );
}

export default AttendanceDetailModal;
