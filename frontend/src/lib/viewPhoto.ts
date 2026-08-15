const API_URL = 'http://localhost:3000';

export async function getAttendancePhotoUrl(
  attendanceId: number,
  type: 'clock-in' | 'clock-out',
): Promise<string> {
  const res = await fetch(`${API_URL}/attendance/${attendanceId}/photo/${type}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || 'Gagal memuat foto');
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Buka foto clock-in/out di tab baru.
 */
export async function viewAttendancePhoto(
  attendanceId: number,
  type: 'clock-in' | 'clock-out',
): Promise<void> {
  const objectUrl = await getAttendancePhotoUrl(attendanceId, type);
  window.open(objectUrl, '_blank');
}
