import { useCallback, useEffect, useRef, useState } from 'react'
import { positionToTrackPoint } from '../domain/geo'
import { RideEngine } from '../domain/ride-engine'
import type { RideRecord } from '../types'

export function useRideRecorder() {
  const engine = useRef(new RideEngine()).current
  const [snapshot, setSnapshot] = useState(engine.snapshot())
  const [gpsError, setGpsError] = useState<string | null>(null)

  useEffect(() => {
    if (snapshot.status !== 'recording') return
    if (!navigator.geolocation) {
      setGpsError('当前设备不支持定位。')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsError(null)
        setSnapshot(engine.ingest(positionToTrackPoint(position)))
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? '定位权限被拒绝，请在浏览器设置中允许精确位置。'
            : '暂时无法获得 GPS 信号，请移至开阔区域。'
        setGpsError(message)
      },
      { enableHighAccuracy: true, maximumAge: 1_000, timeout: 12_000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [engine, snapshot.status])

  useEffect(() => {
    if (snapshot.status !== 'recording') return
    const timer = window.setInterval(() => setSnapshot(engine.tick()), 1_000)
    return () => window.clearInterval(timer)
  }, [engine, snapshot.status])

  useEffect(() => {
    if (snapshot.status !== 'recording' || !('wakeLock' in navigator)) return
    let released = false
    let lock: WakeLockSentinel | null = null

    navigator.wakeLock
      .request('screen')
      .then((sentinel) => {
        if (released) sentinel.release()
        else lock = sentinel
      })
      .catch(() => undefined)

    return () => {
      released = true
      lock?.release()
    }
  }, [snapshot.status])

  const start = useCallback(() => {
    setGpsError(null)
    setSnapshot(engine.start())
  }, [engine])

  const pause = useCallback(() => setSnapshot(engine.pause()), [engine])
  const resume = useCallback(() => setSnapshot(engine.resume()), [engine])

  const finish = useCallback((): RideRecord | null => {
    const ride = engine.finish()
    setSnapshot(engine.snapshot())
    return ride
  }, [engine])

  return { snapshot, gpsError, start, pause, resume, finish }
}
