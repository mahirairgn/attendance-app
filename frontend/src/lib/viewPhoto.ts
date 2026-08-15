const API_URL = 'http://localhost:3000';

/**
 * Buka foto clock-in/out di tab baru. Endpoint-nya butuh header Authorization,
 * jadi tidak bisa dibuka via <a href> biasa — token dilampirkan manual di sini.
 */
export async function viewAttendancePhoto(
  attendanceId: number,
  type: 'clock-in' | 'clock-out',
): Promise<void> {
  const res = await fetch(`${API_URL}/attendance/${attendanceId}/photo/${type}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || 'Gagal memuat foto');
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank');
}
