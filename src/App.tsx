import { useEffect, useState } from 'react'
import { Bike, Gauge, History, Map as MapIcon, ShieldCheck } from 'lucide-react'
import { Dashboard } from './components/Dashboard'
import { RideHistory } from './components/RideHistory'
import { TrackMap } from './components/TrackMap'
import { useRideRecorder } from './hooks/useRideRecorder'
import { useSensors } from './hooks/useSensors'
import { deleteRide, listRides, saveRide } from './storage/rides'
import type { RideRecord } from './types'

type Tab = 'dashboard' | 'track' | 'history'

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [rides, setRides] = useState<RideRecord[]>([])
  const [clock, setClock] = useState(new Date())
  const recorder = useRideRecorder()
  const sensors = useSensors()

  useEffect(() => {
    listRides().then(setRides).catch(() => undefined)
    const timer = window.setInterval(() => setClock(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const finishRide = async () => {
    if (!window.confirm('结束本次骑行并保存记录？')) return
    const ride = recorder.finish()
    if (!ride) return
    await saveRide(ride)
    setRides((current) => [ride, ...current])
  }

  const removeRide = async (id: string) => {
    if (!window.confirm('确定删除这条本地骑行记录？此操作无法撤销。')) return
    await deleteRide(id)
    setRides((current) => current.filter((ride) => ride.id !== id))
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark"><Bike size={22} /></span>
          <div><strong>OPEN BIKE</strong><span>COMPUTER</span></div>
        </div>
        <div className="header-status">
          <span>{clock.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="privacy-badge"><ShieldCheck size={14} />本机存储</span>
        </div>
      </header>

      <main>
        {tab === 'dashboard' && (
          <Dashboard
            snapshot={recorder.snapshot}
            sensors={sensors.readings}
            sensorSupported={sensors.supported}
            sensorError={sensors.error}
            gpsError={recorder.gpsError}
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
      </main>

      <nav className="bottom-nav" aria-label="主导航">
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
          <Gauge size={21} /><span>仪表</span>
        </button>
        <button className={tab === 'track' ? 'active' : ''} onClick={() => setTab('track')}>
          <MapIcon size={21} /><span>轨迹</span>
          {recorder.snapshot.status === 'recording' && <i />}
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          <History size={21} /><span>记录</span>
        </button>
      </nav>
    </div>
  )
}

export default App
