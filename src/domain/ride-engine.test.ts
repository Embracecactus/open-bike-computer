import { describe, expect, it } from 'vitest'
import type { TrackPoint } from '../types'
import { RideEngine } from './ride-engine'

const point = (longitude: number, timestamp: number, overrides: Partial<TrackPoint> = {}): TrackPoint => ({
  latitude: 0,
  longitude,
  altitude: 10,
  accuracy: 4,
  speed: null,
  timestamp,
  ...overrides,
})

describe('RideEngine', () => {
  it('calculates distance, speed and moving time from GPS points', () => {
    const engine = new RideEngine()
    engine.start(1_000)
    engine.ingest(point(0, 1_000))
    const snapshot = engine.ingest(point(0.0001, 5_000))

    expect(snapshot.metrics.distanceM).toBeCloseTo(11.12, 1)
    expect(snapshot.metrics.currentSpeedMps).toBeCloseTo(2.78, 1)
    expect(snapshot.metrics.movingTimeMs).toBe(4_000)
    expect(snapshot.metrics.averageSpeedMps).toBeCloseTo(2.78, 1)
  })

  it('does not count paused time', () => {
    const engine = new RideEngine()
    engine.start(1_000)
    engine.tick(6_000)
    engine.pause(6_000)
    engine.resume(16_000)
    const snapshot = engine.tick(21_000)

    expect(snapshot.metrics.elapsedTimeMs).toBe(10_000)
  })

  it('rejects inaccurate points and implausible jumps', () => {
    const engine = new RideEngine()
    engine.start(1_000)
    engine.ingest(point(0, 1_000))
    engine.ingest(point(0.0001, 2_000, { accuracy: 120 }))
    const snapshot = engine.ingest(point(1, 3_000))

    expect(snapshot.points).toHaveLength(1)
    expect(snapshot.metrics.distanceM).toBe(0)
  })
})
