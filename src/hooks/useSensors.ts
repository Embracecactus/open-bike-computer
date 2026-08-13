import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, PermissionsAndroid, Platform } from 'react-native'
import { toByteArray } from 'base64-js'
import {
  BleManager,
  type Characteristic,
  type Device,
  type Subscription,
} from '@sfourdrinier/react-native-ble-plx'
import {
  parseCscMeasurement,
  parseHeartRateMeasurement,
  type CscParserState,
} from '../domain/sensors'
import type { SensorReadings } from '../types'

const HEART_RATE_SERVICE = '180d'
const HEART_RATE_MEASUREMENT = '2a37'
const CSC_SERVICE = '1816'
const CSC_MEASUREMENT = '2a5b'

const initialReadings: SensorReadings = {
  heartRate: null,
  cadenceRpm: null,
  wheelSpeedMps: null,
  heartRateConnected: false,
  cadenceConnected: false,
}

const toDataView = (value: string) => {
  const bytes = toByteArray(value)
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

export function useSensors() {
  const manager = useMemo(() => new BleManager(), [])
  const [readings, setReadings] = useState<SensorReadings>(initialReadings)
  const [error, setError] = useState<string | null>(null)
  const devices = useRef<Device[]>([])
  const subscriptions = useRef<Subscription[]>([])
  const cscState = useRef<CscParserState>({})

  useEffect(() => {
    return () => {
      subscriptions.current.forEach((subscription) => subscription.remove())
      devices.current.forEach((device) => void device.cancelConnection().catch(() => undefined))
      manager.destroy()
    }
  }, [manager])

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return true
    if (typeof Platform.Version === 'number' && Platform.Version < 31) {
      return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) === 'granted'
    }
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ])
    return Object.values(result).every((status) => status === PermissionsAndroid.RESULTS.GRANTED)
  }, [])

  const scanForService = useCallback(async (service: string): Promise<Device | null> => {
    if (!(await requestPermissions())) {
      setError('需要附近设备/蓝牙权限才能连接骑行传感器。')
      return null
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        manager.stopDeviceScan()
        resolve(null)
      }, 12_000)

      manager.startDeviceScan([service], null, (scanError, device) => {
        if (scanError) {
          clearTimeout(timeout)
          manager.stopDeviceScan()
          setError('蓝牙扫描失败，请确认系统蓝牙已开启。')
          resolve(null)
          return
        }
        if (!device) return
        clearTimeout(timeout)
        manager.stopDeviceScan()
        resolve(device)
      })
    })
  }, [manager, requestPermissions])

  const connectHeartRate = useCallback(async () => {
    setError(null)
    try {
      const found = await scanForService(HEART_RATE_SERVICE)
      if (!found) {
        setError('未发现心率设备，请佩戴并唤醒后重试。')
        return
      }
      const device = await found.connect({ timeout: 12_000 })
      await device.discoverAllServicesAndCharacteristics()
      devices.current.push(device)
      subscriptions.current.push(
        manager.onDeviceDisconnected(device.id, () => {
          setReadings((current) => ({ ...current, heartRate: null, heartRateConnected: false }))
        }),
      )
      const subscription = device.monitorCharacteristicForService(
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT,
        (monitorError: Error | null, characteristic: Characteristic | null) => {
          if (monitorError || !characteristic?.value) return
          setReadings((current) => ({
            ...current,
            heartRate: parseHeartRateMeasurement(toDataView(characteristic.value!)),
            heartRateConnected: true,
          }))
        },
      )
      subscriptions.current.push(subscription)
      setReadings((current) => ({ ...current, heartRateConnected: true }))
    } catch {
      setError('心率设备连接失败，请确认设备未被其他 App 占用。')
    }
  }, [manager, scanForService])

  const connectCadence = useCallback(async () => {
    setError(null)
    try {
      const found = await scanForService(CSC_SERVICE)
      if (!found) {
        setError('未发现速度/踏频设备，请转动曲柄唤醒后重试。')
        return
      }
      const device = await found.connect({ timeout: 12_000 })
      await device.discoverAllServicesAndCharacteristics()
      devices.current.push(device)
      subscriptions.current.push(
        manager.onDeviceDisconnected(device.id, () => {
          cscState.current = {}
          setReadings((current) => ({
            ...current,
            cadenceRpm: null,
            wheelSpeedMps: null,
            cadenceConnected: false,
          }))
        }),
      )
      const subscription = device.monitorCharacteristicForService(
        CSC_SERVICE,
        CSC_MEASUREMENT,
        (monitorError: Error | null, characteristic: Characteristic | null) => {
          if (monitorError || !characteristic?.value) return
          const reading = parseCscMeasurement(toDataView(characteristic.value), cscState.current)
          cscState.current = reading.state
          setReadings((current) => ({
            ...current,
            cadenceRpm: reading.cadenceRpm ?? current.cadenceRpm,
            wheelSpeedMps: reading.wheelSpeedMps ?? current.wheelSpeedMps,
            cadenceConnected: true,
          }))
        },
      )
      subscriptions.current.push(subscription)
      setReadings((current) => ({ ...current, cadenceConnected: true }))
    } catch {
      setError('速度/踏频设备连接失败，请确认它支持标准 BLE CSC 协议。')
    }
  }, [manager, scanForService])

  const showBleHelp = useCallback(() => {
    Alert.alert('连接骑行传感器', '请先唤醒传感器，再点击心率或踏频数据卡片。设备需要支持标准 Bluetooth Low Energy 协议。')
  }, [])

  return {
    readings,
    error,
    supported: true,
    connectHeartRate,
    connectCadence,
    showBleHelp,
  }
}
