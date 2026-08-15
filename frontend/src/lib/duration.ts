export function toSeconds(time: string): number {
  const [h, m, s] = time.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

export function formatDuration(seconds: number): string {
  if (seconds < 0) return '-';
  const jam = Math.floor(seconds / 3600);
  const menit = Math.floor((seconds % 3600) / 60);
  return `${jam} hours ${menit} minutes`;
}