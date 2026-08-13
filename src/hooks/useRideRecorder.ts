import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import * as KeepAwake from 'expo-keep-awake'
import * as Location from 'expo-location'
import { locationToTrackPoint } from '../domain/geo'
import { RideEngine } from '../domain/ride-engine'
import {
  clearBufferedPoints,
  readBufferedPoints,
  requestLocationPermissions,
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../services/background-location'
import type { RideRecord } from '../types'

const KEEP_AWAKE_TAG = 'open-bike-computer-ride'

export function useRideRecorder() {
  const engine = useRef(new RideEngine()).current
  const [snapshot, setSnapshot] = useState(engine.snapshot())
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    // A previous process may have been terminated mid-ride. Until full crash
    // recovery lands, never leave a stale native location service running.
    void stopBackgroundTracking().catch(() => undefined)
  }, [])

  const flushBackgroundPoints = useCallback(async () => {
    const points = await readBufferedPoints()
    if (!points.length) return
    points.sort((a, b) => a.timestamp - b.timestamp).forEach((point) => engine.ingest(point))
    await clearBufferedPoints()
    setSnapshot(engine.snapshot())
  }, [engine])

  useEffect(() => {
    if (snapshot.status !== 'recording') return
    let subscription: Location.LocationSubscription | null = null

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 1,
        timeInterval: 1_000,
      },
      (location) => {
        setGpsError(null)
        setSnapshot(engine.ingest(locationToTrackPoint(location)))
      },
    )
      .then((value) => {
        subscription = value
      })
      .catch(() => setGpsError('暂时无法获得 GPS 信号，请检查定位服务。'))

    const tickTimer = setInterval(() => setSnapshot(engine.tick()), 1_000)
    const flushTimer = setInterval(() => void flushBackgroundPoints(), 5_000)
    void KeepAwake.activateKeepAwakeAsync(KEEP_AWAKE_TAG)

    return () => {
      subscription?.remove()
      clearInterval(tickTimer)
      clearInterval(flushTimer)
      void KeepAwake.deactivateKeepAwake(KEEP_AWAKE_TAG)
    }
  }, [engine, flushBackgroundPoints, snapshot.status])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && snapshot.status === 'recording') void flushBackgroundPoints()
    })
    return () => subscription.remove()
  }, [flushBackgroundPoints, snapshot.status])

  const start = useCallback(async () => {
    setStarting(true)
    setGpsError(null)
    try {
      const permissions = await requestLocationPermissions()
      if (!permissions.foreground) {
        setGpsError('需要精确定位权限才能记录骑行。')
        return
      }

      await clearBufferedPoints()
      setSnapshot(engine.start())

      if (permissions.background) {
        try {
          await startBackgroundTracking()
        } catch {
          setGpsError('后台定位启动失败；本次仍会在前台继续记录。')
        }
      } else {
        setGpsError('后台定位未授权；切换应用或锁屏后可能停止记录。')
      }
    } catch {
      setGpsError('定位服务启动失败，请检查系统权限。')
    } finally {
      setStarting(false)
    }
  }, [engine])

  const pause = useCallback(async () => {
    await stopBackgroundTracking().catch(() => undefined)
    await flushBackgroundPoints().catch(() => undefined)
    setSnapshot(engine.pause())
  }, [engine, flushBackgroundPoints])

  const resume = useCallback(async () => {
    setSnapshot(engine.resume())
    const permission = await Location.getBackgroundPermissionsAsync()
    if (permission.status === Location.PermissionStatus.GRANTED) {
      await startBackgroundTracking().catch(() => setGpsError('后台定位未能恢复；请保持 App 在前台。'))
    }
  }, [engine])

  const finish = useCallback(async (): Promise<RideRecord | null> => {
    await stopBackgroundTracking().catch(() => undefined)
    await flushBackgroundPoints().catch(() => undefined)
    const ride = engine.finish()
    setSnapshot(engine.snapshot())
    await clearBufferedPoints()
    return ride
  }, [engine, flushBackgroundPoints])

  return { snapshot, gpsError, starting, start, pause, resume, finish }
}
