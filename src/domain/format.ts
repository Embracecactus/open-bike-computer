export function formatSpeed(speedMps: number): string {
  return (speedMps * 3.6).toFixed(1)
}

export function formatDistance(distanceM: number): string {
  if (distanceM < 1_000) return `${Math.round(distanceM)} m`
  return `${(distanceM / 1_000).toFixed(2)} km`
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1_000))
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export function formatRideDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}
