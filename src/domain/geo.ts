import type { TrackPoint } from '../types'

const EARTH_RADIUS_M = 6_371_000

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export function haversineDistance(a: TrackPoint, b: TrackPoint): number {
  const latitudeDelta = toRadians(b.latitude - a.latitude)
  const longitudeDelta = toRadians(b.longitude - a.longitude)
  const latitudeA = toRadians(a.latitude)
  const latitudeB = toRadians(b.latitude)

  const chord =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(chord))
}

interface NativeLocation {
  coords: {
    latitude: number
    longitude: number
    altitude: number | null
    accuracy: number | null
    speed: number | null
  }
  timestamp: number
}

export function locationToTrackPoint(position: NativeLocation): TrackPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    altitude: position.coords.altitude,
    accuracy: position.coords.accuracy ?? 100,
    speed: position.coords.speed,
    timestamp: position.timestamp,
  }
}
