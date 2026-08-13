import { useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Bike, Gauge, History, Map as MapIcon, ShieldCheck } from 'lucide-react-native'
import { Dashboard } from './src/components/Dashboard'
import { RideHistory } from './src/components/RideHistory'
import { TrackMap } from './src/components/TrackMap'
import { useRideRecorder } from './src/hooks/useRideRecorder'
import { useSensors } from './src/hooks/useSensors'
import { deleteRide, listRides, saveRide } from './src/storage/rides'
import type { RideRecord } from './src/types'
import './src/services/background-location'

type Tab = 'dashboard' | 'track' | 'history'

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [rides, setRides] = useState<RideRecord[]>([])
  const [clock, setClock] = useState(new Date())
  const recorder = useRideRecorder()
  const sensors = useSensors()

  useEffect(() => {
    void listRides().then(setRides)
    const timer = setInterval(() => setClock(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const finishRide = () => {
    Alert.alert('结束本次骑行？', '轨迹和统计数据将保存在这台手机中。', [
      { text: '取消', style: 'cancel' },
      {
        text: '结束并保存',
        style: 'destructive',
        onPress: () => {
          void recorder.finish().then(async (ride) => {
            if (!ride) return
            await saveRide(ride)
            setRides((current) => [ride, ...current])
          })
        },
      },
    ])
  }

  const removeRide = async (id: string) => {
    await deleteRide(id)
    setRides((current) => current.filter((ride) => ride.id !== id))
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}><Bike color="#11140b" size={22} /></View>
            <View><Text style={styles.brandTitle}>OPEN BIKE</Text><Text style={styles.brandSubtitle}>COMPUTER</Text></View>
          </View>
          <View style={styles.headerStatus}>
            <Text style={styles.clock}>{clock.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={styles.privacy}><ShieldCheck color="#8b9189" size={13} /><Text style={styles.privacyText}>本机存储</Text></View>
          </View>
        </View>

        <View style={styles.main}>
          {tab === 'dashboard' && (
            <Dashboard
              snapshot={recorder.snapshot}
              sensors={sensors.readings}
              sensorError={sensors.error}
              gpsError={recorder.gpsError}
              starting={recorder.starting}
              onStart={recorder.start}
              onPause={recorder.pause}
              onResume={recorder.resume}
              onFinish={finishRide}
              onConnectHeartRate={sensors.connectHeartRate}
              onConnectCadence={sensors.connectCadence}
            />
          )}
          {tab === 'track' && <TrackMap points={recorder.snapshot.points} />}
          {tab === 'history' && <RideHistory rides={rides} onDelete={removeRide} />}
        </View>

        <View style={styles.bottomNav}>
          <NavButton active={tab === 'dashboard'} label="仪表" onPress={() => setTab('dashboard')} icon="gauge" />
          <NavButton active={tab === 'track'} label="轨迹" onPress={() => setTab('track')} icon="map" recording={recorder.snapshot.status === 'recording'} />
          <NavButton active={tab === 'history'} label="记录" onPress={() => setTab('history')} icon="history" />
        </View>
      </View>
    </SafeAreaView>
  )
}

interface NavButtonProps {
  active: boolean
  label: string
  onPress: () => void
  icon: 'gauge' | 'map' | 'history'
  recording?: boolean
}

function NavButton({ active, label, onPress, icon, recording }: NavButtonProps) {
  const color = active ? '#b8f20d' : '#656b64'
  const Icon = icon === 'gauge' ? Gauge : icon === 'map' ? MapIcon : History
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} style={styles.navButton} onPress={onPress}>
      <Icon color={color} size={21} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      {recording && <View style={styles.recordingBadge} />}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080a09', paddingTop: NativeStatusBar.currentHeight ?? 0 },
  shell: { flex: 1, backgroundColor: '#080a09' },
  header: { minHeight: 66, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#222622' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 5, backgroundColor: '#b8f20d', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: '#f1f3ed', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  brandSubtitle: { color: '#b8f20d', fontWeight: '800', fontSize: 10, letterSpacing: 2 },
  headerStatus: { alignItems: 'flex-end', gap: 3 },
  clock: { color: '#e7e9e4', fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  privacyText: { color: '#8b9189', fontSize: 10 },
  main: { flex: 1 },
  bottomNav: { height: 69, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#222622', backgroundColor: '#0d100e' },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navLabel: { color: '#656b64', fontSize: 9 },
  navLabelActive: { color: '#b8f20d' },
  recordingBadge: { width: 5, height: 5, borderRadius: 5, backgroundColor: '#ff6b5e', position: 'absolute', top: 12, left: '56%' },
})
