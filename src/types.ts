export type RideStatus = 'idle' | 'recording' | 'paused' | 'finished'

export interface TrackPoint {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number
  speed: number | null
  timestamp: number
}

export interface RideMetrics {
  distanceM: number
  elapsedTimeMs: number
  movingTimeMs: number
  currentSpeedMps: number
  averageSpeedMps: number
  maxSpeedMps: number
  elevationGainM: number
}

export interface RideSnapshot {
  status: RideStatus
  startedAt: number | null
  gpsAccuracy: number | null
  points: TrackPoint[]
  metrics: RideMetrics
}

export interface RideRecord {
  id: string
  startedAt: number
  endedAt: number
  points: TrackPoint[]
  metrics: RideMetrics
}

export interface SensorReadings {
  heartRate: number | null
  cadenceRpm: number | null
  wheelSpeedMps: number | null
  heartRateConnected: boolean
  cadenceConnected: boolean
}
