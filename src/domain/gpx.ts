import type { RideRecord } from '../types'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'

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

export async function shareRideGpx(ride: RideRecord): Promise<void> {
  const filename = `ride-${new Date(ride.startedAt).toISOString().replaceAll(':', '-')}.gpx`
  const file = new File(Paths.cache, filename)
  file.create({ overwrite: true })
  file.write(rideToGpx(ride))

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/gpx+xml',
      dialogTitle: '导出骑行 GPX',
      UTI: 'com.topografix.gpx',
    })
  }
}
