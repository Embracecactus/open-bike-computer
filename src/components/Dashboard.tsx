import {
  Activity,
  Bluetooth,
  Gauge,
  HeartPulse,
  Mountain,
  Pause,
  Play,
  Radio,
  Route,
  Satellite,
  Square,
  Timer,
} from 'lucide-react'
import { formatDistance, formatDuration, formatSpeed } from '../domain/format'
import type { RideSnapshot, SensorReadings } from '../types'

interface DashboardProps {
  snapshot: RideSnapshot
  sensors: SensorReadings
  sensorSupported: boolean
  sensorError: string | null
  gpsError: string | null
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onFinish: () => void
  onConnectHeartRate: () => void
  onConnectCadence: () => void
}

export function Dashboard({
  snapshot,
  sensors,
  sensorSupported,
  sensorError,
  gpsError,
  onStart,
  onPause,
  onResume,
  onFinish,
  onConnectHeartRate,
  onConnectCadence,
}: DashboardProps) {
  const { metrics } = snapshot
  const liveSpeed = sensors.wheelSpeedMps ?? metrics.currentSpeedMps
  const isActive = snapshot.status === 'recording' || snapshot.status === 'paused'

  const metricsList = [
    { label: '里程', value: formatDistance(metrics.distanceM), icon: Route },
    { label: '骑行时间', value: formatDuration(metrics.elapsedTimeMs), icon: Timer },
    { label: '平均速度', value: `${formatSpeed(metrics.averageSpeedMps)} km/h`, icon: Activity },
    { label: '最高速度', value: `${formatSpeed(metrics.maxSpeedMps)} km/h`, icon: Gauge },
    { label: '累计爬升', value: `${Math.round(metrics.elevationGainM)} m`, icon: Mountain },
    { label: '移动时间', value: formatDuration(metrics.movingTimeMs), icon: Radio },
  ]

  return (
    <>
      <section className={`speed-hero ${snapshot.status === 'recording' ? 'is-recording' : ''}`}>
        <div className="speed-status">
          <span className={`live-dot ${snapshot.status}`} />
          {snapshot.status === 'recording'
            ? '正在记录'
            : snapshot.status === 'paused'
              ? '已暂停'
              : snapshot.status === 'finished'
                ? '骑行已保存'
                : '准备出发'}
        </div>
        <div className="speed-value" aria-label={`${formatSpeed(liveSpeed)} 千米每小时`}>
          {formatSpeed(liveSpeed)}
        </div>
        <div className="speed-unit">km/h</div>
        <div className="speed-source">{sensors.wheelSpeedMps !== null ? 'BLE 轮速' : 'GPS 速度'}</div>
      </section>

      {(gpsError || sensorError) && <div className="notice error-notice">{gpsError ?? sensorError}</div>}

      <section className="sensor-row" aria-label="传感器状态">
        <button className={`sensor-chip ${sensors.heartRateConnected ? 'connected' : ''}`} onClick={onConnectHeartRate}>
          <HeartPulse size={19} />
          <span><small>心率</small><strong>{sensors.heartRate ?? '--'} <em>bpm</em></strong></span>
          <Bluetooth size={14} />
        </button>
        <button className={`sensor-chip ${sensors.cadenceConnected ? 'connected' : ''}`} onClick={onConnectCadence}>
          <Gauge size={19} />
          <span><small>踏频</small><strong>{sensors.cadenceRpm === null ? '--' : Math.round(sensors.cadenceRpm)} <em>rpm</em></strong></span>
          <Bluetooth size={14} />
        </button>
        <div className={`sensor-chip gps-chip ${snapshot.gpsAccuracy !== null ? 'connected' : ''}`}>
          <Satellite size={19} />
          <span><small>GPS 精度</small><strong>{snapshot.gpsAccuracy === null ? '--' : Math.round(snapshot.gpsAccuracy)} <em>m</em></strong></span>
        </div>
      </section>

      {!sensorSupported && (
        <p className="compatibility-note">蓝牙传感器需 Android Chrome 与 HTTPS；当前仍可正常使用 GPS 码表。</p>
      )}

      <section className="metrics-grid" aria-label="骑行数据">
        {metricsList.map(({ label, value, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div className="metric-label"><Icon size={15} />{label}</div>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <div className="ride-controls">
        {!isActive ? (
          <button className="primary-control" onClick={onStart}><Play fill="currentColor" size={23} />开始骑行</button>
        ) : (
          <>
            <button className="secondary-control" onClick={snapshot.status === 'paused' ? onResume : onPause}>
              {snapshot.status === 'paused' ? <Play fill="currentColor" size={21} /> : <Pause fill="currentColor" size={21} />}
              {snapshot.status === 'paused' ? '继续' : '暂停'}
            </button>
            <button className="finish-control" onClick={onFinish}><Square fill="currentColor" size={18} />结束并保存</button>
          </>
        )}
      </div>
    </>
  )
}
