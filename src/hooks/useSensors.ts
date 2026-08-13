import { useCallback, useRef, useState } from 'react'
import type { SensorReadings } from '../types'
import {
  parseCscMeasurement,
  parseHeartRateMeasurement,
  type CscParserState,
} from '../domain/sensors'

const initialReadings: SensorReadings = {
  heartRate: null,
  cadenceRpm: null,
  wheelSpeedMps: null,
  heartRateConnected: false,
  cadenceConnected: false,
}

export function useSensors() {
  const [readings, setReadings] = useState<SensorReadings>(initialReadings)
  const [error, setError] = useState<string | null>(null)
  const devices = useRef<BluetoothDevice[]>([])
  const cscState = useRef<CscParserState>({})

  const supported = typeof navigator !== 'undefined' && Boolean(navigator.bluetooth)

  const connectHeartRate = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError('当前浏览器不支持 Web Bluetooth，请使用 Android Chrome。')
      return
    }

    try {
      setError(null)
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] })
      const server = await device.gatt?.connect()
      if (!server) throw new Error('无法连接设备')
      const service = await server.getPrimaryService('heart_rate')
      const characteristic = await service.getCharacteristic('heart_rate_measurement')

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value
        if (!value) return
        setReadings((current) => ({
          ...current,
          heartRate: parseHeartRateMeasurement(value),
          heartRateConnected: true,
        }))
      })

      device.addEventListener('gattserverdisconnected', () => {
        setReadings((current) => ({ ...current, heartRate: null, heartRateConnected: false }))
      })

      await characteristic.startNotifications()
      devices.current.push(device)
      setReadings((current) => ({ ...current, heartRateConnected: true }))
    } catch (connectionError) {
      if ((connectionError as DOMException).name !== 'NotFoundError') {
        setError('心率设备连接失败，请确认设备已唤醒且支持蓝牙。')
      }
    }
  }, [])

  const connectCadence = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError('当前浏览器不支持 Web Bluetooth，请使用 Android Chrome。')
      return
    }

    try {
      setError(null)
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: ['cycling_speed_and_cadence'] }] })
      const server = await device.gatt?.connect()
      if (!server) throw new Error('无法连接设备')
      const service = await server.getPrimaryService('cycling_speed_and_cadence')
      const characteristic = await service.getCharacteristic('csc_measurement')

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value
        if (!value) return
        const reading = parseCscMeasurement(value, cscState.current)
        cscState.current = reading.state
        setReadings((current) => ({
          ...current,
          cadenceRpm: reading.cadenceRpm ?? current.cadenceRpm,
          wheelSpeedMps: reading.wheelSpeedMps ?? current.wheelSpeedMps,
          cadenceConnected: true,
        }))
      })

      device.addEventListener('gattserverdisconnected', () => {
        cscState.current = {}
        setReadings((current) => ({
          ...current,
          cadenceRpm: null,
          wheelSpeedMps: null,
          cadenceConnected: false,
        }))
      })

      await characteristic.startNotifications()
      devices.current.push(device)
      setReadings((current) => ({ ...current, cadenceConnected: true }))
    } catch (connectionError) {
      if ((connectionError as DOMException).name !== 'NotFoundError') {
        setError('速度/踏频设备连接失败，请确认设备已唤醒且支持 BLE CSC。')
      }
    }
  }, [])

  return { readings, supported, error, connectHeartRate, connectCadence }
}
