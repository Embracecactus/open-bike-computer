import { describe, expect, it } from 'vitest'
import { parseCscMeasurement, parseHeartRateMeasurement } from './sensors'

describe('Bluetooth sensor parsers', () => {
  it('parses 8-bit and 16-bit heart rate values', () => {
    expect(parseHeartRateMeasurement(new DataView(Uint8Array.from([0, 142]).buffer))).toBe(142)
    expect(parseHeartRateMeasurement(new DataView(Uint8Array.from([1, 44, 1]).buffer))).toBe(300)
  })

  it('calculates cadence from consecutive CSC measurements', () => {
    const first = new ArrayBuffer(5)
    const firstView = new DataView(first)
    firstView.setUint8(0, 0x02)
    firstView.setUint16(1, 100, true)
    firstView.setUint16(3, 1_024, true)

    const second = new ArrayBuffer(5)
    const secondView = new DataView(second)
    secondView.setUint8(0, 0x02)
    secondView.setUint16(1, 102, true)
    secondView.setUint16(3, 3_072, true)

    const initial = parseCscMeasurement(firstView, {})
    const reading = parseCscMeasurement(secondView, initial.state)

    expect(reading.cadenceRpm).toBe(60)
  })

  it('calculates wheel speed from CSC wheel revolutions', () => {
    const createMeasurement = (revolutions: number, eventTime: number) => {
      const buffer = new ArrayBuffer(7)
      const view = new DataView(buffer)
      view.setUint8(0, 0x01)
      view.setUint32(1, revolutions, true)
      view.setUint16(5, eventTime, true)
      return view
    }

    const initial = parseCscMeasurement(createMeasurement(20, 1_024), {})
    const reading = parseCscMeasurement(createMeasurement(21, 2_048), initial.state)

    expect(reading.wheelSpeedMps).toBeCloseTo(2.105, 3)
  })
})
