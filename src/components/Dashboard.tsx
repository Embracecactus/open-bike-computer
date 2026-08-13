import type { ComponentType } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
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
} from 'lucide-react-native'
import { formatDistance, formatDuration, formatSpeed } from '../domain/format'
import type { RideSnapshot, SensorReadings } from '../types'

const ACCENT = '#b8f20d'

interface DashboardProps {
  snapshot: RideSnapshot
  sensors: SensorReadings
  sensorError: string | null
  gpsError: string | null
  starting: boolean
  onStart: () => Promise<void>
  onPause: () => Promise<void>
  onResume: () => Promise<void>
  onFinish: () => void
  onConnectHeartRate: () => Promise<void>
  onConnectCadence: () => Promise<void>
}

interface MetricCardProps {
  label: string
  value: string
  icon: ComponentType<{ color?: string; size?: number }>
}

function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricLabel}><Icon color="#72786f" size={15} /><Text style={styles.muted}>{label}</Text></View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

export function Dashboard({
  snapshot,
  sensors,
  sensorError,
  gpsError,
  starting,
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
  const statusText = snapshot.status === 'recording'
    ? '正在记录'
    : snapshot.status === 'paused'
      ? '已暂停'
      : snapshot.status === 'finished'
        ? '骑行已保存'
        : '准备出发'

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.speedHero, snapshot.status === 'recording' && styles.speedHeroActive]}>
        <View style={styles.statusRow}>
          <View style={[styles.liveDot, snapshot.status === 'recording' && styles.liveDotActive]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <Text style={styles.speedSource}>{sensors.wheelSpeedMps !== null ? 'BLE 轮速' : 'GPS 速度'}</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.speedValue}>{formatSpeed(liveSpeed)}</Text>
        <Text style={styles.speedUnit}>KM/H</Text>
      </View>

      {(gpsError || sensorError) && <Text style={styles.errorNotice}>{gpsError ?? sensorError}</Text>}

      <View style={styles.sensorRow}>
        <Pressable style={[styles.sensorChip, sensors.heartRateConnected && styles.sensorConnected]} onPress={() => void onConnectHeartRate()}>
          <HeartPulse color={sensors.heartRateConnected ? ACCENT : '#6f756e'} size={20} />
          <Text style={styles.sensorLabel}>心率</Text>
          <Text style={styles.sensorValue}>{sensors.heartRate ?? '--'} <Text style={styles.sensorUnit}>bpm</Text></Text>
          <Bluetooth color={sensors.heartRateConnected ? ACCENT : '#505650'} size={13} />
        </Pressable>
        <Pressable style={[styles.sensorChip, sensors.cadenceConnected && styles.sensorConnected]} onPress={() => void onConnectCadence()}>
          <Gauge color={sensors.cadenceConnected ? ACCENT : '#6f756e'} size={20} />
          <Text style={styles.sensorLabel}>踏频</Text>
          <Text style={styles.sensorValue}>{sensors.cadenceRpm === null ? '--' : Math.round(sensors.cadenceRpm)} <Text style={styles.sensorUnit}>rpm</Text></Text>
          <Bluetooth color={sensors.cadenceConnected ? ACCENT : '#505650'} size={13} />
        </Pressable>
        <View style={[styles.sensorChip, snapshot.gpsAccuracy !== null && styles.sensorConnected]}>
          <Satellite color={snapshot.gpsAccuracy !== null ? ACCENT : '#6f756e'} size={20} />
          <Text style={styles.sensorLabel}>GPS 精度</Text>
          <Text style={styles.sensorValue}>{snapshot.gpsAccuracy === null ? '--' : Math.round(snapshot.gpsAccuracy)} <Text style={styles.sensorUnit}>m</Text></Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="里程" value={formatDistance(metrics.distanceM)} icon={Route} />
        <MetricCard label="骑行时间" value={formatDuration(metrics.elapsedTimeMs)} icon={Timer} />
        <MetricCard label="平均速度" value={`${formatSpeed(metrics.averageSpeedMps)} km/h`} icon={Activity} />
        <MetricCard label="最高速度" value={`${formatSpeed(metrics.maxSpeedMps)} km/h`} icon={Gauge} />
        <MetricCard label="累计爬升" value={`${Math.round(metrics.elevationGainM)} m`} icon={Mountain} />
        <MetricCard label="移动时间" value={formatDuration(metrics.movingTimeMs)} icon={Radio} />
      </View>

      <View style={styles.controls}>
        {!isActive ? (
          <Pressable disabled={starting} style={styles.primaryButton} onPress={() => void onStart()}>
            {starting ? <ActivityIndicator color="#11140b" /> : <Play color="#11140b" fill="#11140b" size={22} />}
            <Text style={styles.primaryButtonText}>{starting ? '正在启动 GPS' : '开始骑行'}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.secondaryButton} onPress={() => void (snapshot.status === 'paused' ? onResume() : onPause())}>
              {snapshot.status === 'paused' ? <Play color="#11140b" fill="#11140b" size={20} /> : <Pause color="#11140b" fill="#11140b" size={20} />}
              <Text style={styles.secondaryButtonText}>{snapshot.status === 'paused' ? '继续' : '暂停'}</Text>
            </Pressable>
            <Pressable style={styles.finishButton} onPress={onFinish}>
              <Square color="#ff8a80" fill="#ff8a80" size={17} />
              <Text style={styles.finishButtonText}>结束并保存</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  speedHero: { height: 238, borderRadius: 24, borderWidth: 1, borderColor: '#242824', backgroundColor: '#111411', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  speedHeroActive: { borderColor: 'rgba(184,242,13,0.35)' },
  statusRow: { position: 'absolute', left: 18, top: 17, flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: '#505550' },
  liveDotActive: { backgroundColor: ACCENT, shadowColor: ACCENT, shadowRadius: 8, shadowOpacity: 1 },
  statusText: { color: '#8b9189', fontSize: 12, letterSpacing: 1 },
  speedSource: { position: 'absolute', right: 18, top: 17, color: '#666c64', fontSize: 10, letterSpacing: 1 },
  speedValue: { color: '#f1f3ed', fontSize: 118, fontWeight: '800', letterSpacing: -5, lineHeight: 126, fontVariant: ['tabular-nums'] },
  speedUnit: { color: ACCENT, fontSize: 14, fontWeight: '700', letterSpacing: 3 },
  errorNotice: { marginTop: 10, color: '#ffb4ad', backgroundColor: 'rgba(255,107,94,0.11)', borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18 },
  sensorRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
  sensorChip: { flex: 1, minWidth: 0, minHeight: 90, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#222622', backgroundColor: '#111411', alignItems: 'flex-start' },
  sensorConnected: { borderColor: 'rgba(184,242,13,0.25)', backgroundColor: 'rgba(184,242,13,0.07)' },
  sensorLabel: { color: '#8b9189', fontSize: 9, marginTop: 6 },
  sensorValue: { color: '#d8dcd5', fontSize: 17, fontWeight: '700', marginTop: 3 },
  sensorUnit: { color: '#8b9189', fontSize: 8, fontWeight: '500' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  metricCard: { width: '48.8%', height: 84, borderRadius: 15, borderWidth: 1, borderColor: '#222622', backgroundColor: '#111411', padding: 13, justifyContent: 'space-between' },
  metricLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { color: '#8b9189', fontSize: 11 },
  metricValue: { color: '#f1f3ed', fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', gap: 9, marginTop: 16 },
  primaryButton: { flex: 1, height: 59, borderRadius: 15, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  primaryButtonText: { color: '#11140b', fontWeight: '800', fontSize: 15 },
  secondaryButton: { flex: 1, height: 59, borderRadius: 15, backgroundColor: '#edf0e8', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  secondaryButtonText: { color: '#11140b', fontWeight: '800' },
  finishButton: { flex: 1.2, height: 59, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,107,94,0.2)', backgroundColor: 'rgba(255,107,94,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  finishButtonText: { color: '#ff8a80', fontWeight: '800' },
})
