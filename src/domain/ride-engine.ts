import type { RideMetrics, RideRecord, RideSnapshot, TrackPoint } from '../types'
import { haversineDistance } from './geo'

const MAX_GPS_ACCURACY_M = 80
const MAX_CYCLING_SPEED_MPS = 35
const MIN_MOVING_SPEED_MPS = 0.7
const MIN_DISTANCE_STEP_M = 1.2
const MIN_ELEVATION_STEP_M = 2

const emptyMetrics = (): RideMetrics => ({
  distanceM: 0,
  elapsedTimeMs: 0,
  movingTimeMs: 0,
  currentSpeedMps: 0,
  averageSpeedMps: 0,
  maxSpeedMps: 0,
  elevationGainM: 0,
})

export class RideEngine {
  private status: RideSnapshot['status'] = 'idle'
  private startedAt: number | null = null
  private pausedAt: number | null = null
  private pausedDurationMs = 0
  private gpsAccuracy: number | null = null
  private points: TrackPoint[] = []
  private metrics = emptyMetrics()

  start(now = Date.now()): RideSnapshot {
    this.status = 'recording'
    this.startedAt = now
    this.pausedAt = null
    this.pausedDurationMs = 0
    this.gpsAccuracy = null
    this.points = []
    this.metrics = emptyMetrics()
    return this.snapshot()
  }

  pause(now = Date.now()): RideSnapshot {
    if (this.status !== 'recording') return this.snapshot()
    this.tick(now)
    this.status = 'paused'
    this.pausedAt = now
    this.metrics.currentSpeedMps = 0
    return this.snapshot()
  }

  resume(now = Date.now()): RideSnapshot {
    if (this.status !== 'paused') return this.snapshot()
    if (this.pausedAt !== null) this.pausedDurationMs += Math.max(0, now - this.pausedAt)
    this.status = 'recording'
    this.pausedAt = null
    return this.snapshot()
  }

  ingest(point: TrackPoint): RideSnapshot {
    if (this.status !== 'recording') return this.snapshot()
    this.gpsAccuracy = point.accuracy

    if (point.accuracy > MAX_GPS_ACCURACY_M) return this.snapshot()

    const previous = this.points.at(-1)
    if (!previous) {
      this.points.push(point)
      return this.snapshot()
    }

    const deltaSeconds = (point.timestamp - previous.timestamp) / 1_000
    if (deltaSeconds <= 0) return this.snapshot()

    const segmentDistance = haversineDistance(previous, point)
    const derivedSpeed = segmentDistance / deltaSeconds
    const reportedSpeed = point.speed !== null && point.speed >= 0 ? point.speed : derivedSpeed
    const candidateSpeed = Math.min(reportedSpeed, MAX_CYCLING_SPEED_MPS)
    const plausibleJump = segmentDistance <= Math.max(60, deltaSeconds * MAX_CYCLING_SPEED_MPS)

    if (!plausibleJump || derivedSpeed > MAX_CYCLING_SPEED_MPS * 1.25) return this.snapshot()

    const smoothedSpeed =
      candidateSpeed < 0.25
        ? 0
        : this.metrics.currentSpeedMps === 0
          ? candidateSpeed
          : this.metrics.currentSpeedMps * 0.62 + candidateSpeed * 0.38

    this.metrics.currentSpeedMps = smoothedSpeed
    this.metrics.maxSpeedMps = Math.max(this.metrics.maxSpeedMps, candidateSpeed)

    if (candidateSpeed >= MIN_MOVING_SPEED_MPS) {
      this.metrics.movingTimeMs += Math.min(deltaSeconds, 10) * 1_000
      if (segmentDistance >= MIN_DISTANCE_STEP_M) this.metrics.distanceM += segmentDistance
    }

    if (previous.altitude !== null && point.altitude !== null) {
      const elevationDelta = point.altitude - previous.altitude
      if (elevationDelta >= MIN_ELEVATION_STEP_M) this.metrics.elevationGainM += elevationDelta
    }

    this.metrics.averageSpeedMps =
      this.metrics.movingTimeMs > 0
        ? this.metrics.distanceM / (this.metrics.movingTimeMs / 1_000)
        : 0

    this.points.push(point)
    this.tick(point.timestamp)
    return this.snapshot()
  }

  tick(now = Date.now()): RideSnapshot {
    if (this.startedAt === null || this.status === 'idle') return this.snapshot()
    const end = this.status === 'paused' && this.pausedAt !== null ? this.pausedAt : now
    this.metrics.elapsedTimeMs = Math.max(0, end - this.startedAt - this.pausedDurationMs)
    return this.snapshot()
  }

  finish(now = Date.now()): RideRecord | null {
    if (this.startedAt === null || (this.status !== 'recording' && this.status !== 'paused')) {
      return null
    }

    this.tick(now)
    this.status = 'finished'
    this.metrics.currentSpeedMps = 0

    return {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${this.startedAt}-${Math.random().toString(36).slice(2)}`,
      startedAt: this.startedAt,
      endedAt: now,
      points: [...this.points],
      metrics: { ...this.metrics },
    }
  }

  snapshot(): RideSnapshot {
    return {
      status: this.status,
      startedAt: this.startedAt,
      gpsAccuracy: this.gpsAccuracy,
      points: [...this.points],
      metrics: { ...this.metrics },
    }
  }
}
