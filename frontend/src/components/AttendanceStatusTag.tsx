import { Tag } from 'antd';

export type AttendanceStatus =
  | 'holiday'
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'missing_out'
  | 'absent';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  holiday: 'Holiday',
  not_started: 'Not Clocked In',
  in_progress: 'Clocked In',
  completed: 'Clocked Out',
  missing_out: 'Missing Clock Out',
  absent: 'Absent',
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  holiday: 'default',
  not_started: 'default',
  in_progress: 'processing',
  completed: 'success',
  missing_out: 'warning',
  absent: 'error',
};

interface AttendanceStatusTagProps {
  status: AttendanceStatus;
}

function AttendanceStatusTag({ status }: AttendanceStatusTagProps) {
  return (
    <Tag color={STATUS_COLOR[status]} variant="outlined">
      {STATUS_LABEL[status]}
    </Tag>
  );
}

export default AttendanceStatusTag;