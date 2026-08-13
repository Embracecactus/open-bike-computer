import type { RideRecord } from '../types'

export function rideToGpx(ride: RideRecord): string {
  const points = ride.points
    .map((point) => {
      const elevation = point.altitude === null ? '' : `<ele>${point.altitude.toFixed(1)}</ele>`
      return `      <trkpt lat="${point.latitude}" lon="${point.longitude}">${elevation}<time>${new Date(point.timestamp).toISOString()}</time></trkpt>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Open Bike Computer" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><time>${new Date(ride.startedAt).toISOString()}</time></metadata>
  <trk><name>Ride ${new Date(ride.startedAt).toISOString()}</name><trkseg>
${points}
  </trkseg></trk>
</gpx>`
}

export function downloadRideGpx(ride: RideRecord): void {
  const blob = new Blob([rideToGpx(ride)], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ride-${new Date(ride.startedAt).toISOString().replaceAll(':', '-')}.gpx`
  anchor.click()
  URL.revokeObjectURL(url)
}
