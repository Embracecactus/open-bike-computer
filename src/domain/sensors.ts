export interface CscParserState {
  wheelRevolutions?: number
  wheelEventTime?: number
  crankRevolutions?: number
  crankEventTime?: number
}

export interface CscReading {
  wheelSpeedMps: number | null
  cadenceRpm: number | null
  state: CscParserState
}

function rolloverDelta(current: number, previous: number, range: number): number {
  return current >= previous ? current - previous : range - previous + current
}

export function parseHeartRateMeasurement(value: DataView): number {
  const flags = value.getUint8(0)
  return flags & 0x01 ? value.getUint16(1, true) : value.getUint8(1)
}

export function parseCscMeasurement(
  value: DataView,
  previous: CscParserState,
  wheelCircumferenceM = 2.105,
): CscReading {
  const flags = value.getUint8(0)
  let offset = 1
  const state: CscParserState = { ...previous }
  let wheelSpeedMps: number | null = null
  let cadenceRpm: number | null = null

  if (flags & 0x01) {
    const wheelRevolutions = value.getUint32(offset, true)
    const wheelEventTime = value.getUint16(offset + 4, true)
    offset += 6

    if (previous.wheelRevolutions !== undefined && previous.wheelEventTime !== undefined) {
      const revolutionDelta = rolloverDelta(wheelRevolutions, previous.wheelRevolutions, 2 ** 32)
      const timeDelta = rolloverDelta(wheelEventTime, previous.wheelEventTime, 2 ** 16) / 1_024
      if (timeDelta > 0) {
        const speed = (revolutionDelta * wheelCircumferenceM) / timeDelta
        if (speed >= 0 && speed <= 40) wheelSpeedMps = speed
      }
    }

    state.wheelRevolutions = wheelRevolutions
    state.wheelEventTime = wheelEventTime
  }

  if (flags & 0x02) {
    const crankRevolutions = value.getUint16(offset, true)
    const crankEventTime = value.getUint16(offset + 2, true)

    if (previous.crankRevolutions !== undefined && previous.crankEventTime !== undefined) {
      const revolutionDelta = rolloverDelta(crankRevolutions, previous.crankRevolutions, 2 ** 16)
      const timeDelta = rolloverDelta(crankEventTime, previous.crankEventTime, 2 ** 16) / 1_024
      if (timeDelta > 0) {
        const cadence = (revolutionDelta / timeDelta) * 60
        if (cadence >= 0 && cadence <= 250) cadenceRpm = cadence
      }
    }

    state.crankRevolutions = crankRevolutions
    state.crankEventTime = crankEventTime
  }

  return { wheelSpeedMps, cadenceRpm, state }
}
