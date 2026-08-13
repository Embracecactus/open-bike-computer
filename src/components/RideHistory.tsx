import { Download, History, Route, Timer, Trash2 } from 'lucide-react'
import { downloadRideGpx } from '../domain/gpx'
import { formatDistance, formatDuration, formatRideDate, formatSpeed } from '../domain/format'
import type { RideRecord } from '../types'

interface RideHistoryProps {
  rides: RideRecord[]
  onDelete: (id: string) => void
}

export function RideHistory({ rides, onDelete }: RideHistoryProps) {
  return (
    <section className="history-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">RIDE LOG</span>
          <h2>骑行记录</h2>
        </div>
        <span className="sample-count">{rides.length} 次骑行</span>
      </div>

      {rides.length === 0 ? (
        <div className="empty-history">
          <History size={34} />
          <strong>还没有骑行记录</strong>
          <span>完成第一次骑行后，数据会安全保存在本机。</span>
        </div>
      ) : (
        <div className="history-list">
          {rides.map((ride) => (
            <article className="ride-card" key={ride.id}>
              <div className="ride-card-top">
                <div>
                  <time>{formatRideDate(ride.startedAt)}</time>
                  <strong>{formatDistance(ride.metrics.distanceM)}</strong>
                </div>
                <span>{formatSpeed(ride.metrics.averageSpeedMps)} <small>km/h 均速</small></span>
              </div>
              <div className="ride-card-meta">
                <span><Timer size={14} />{formatDuration(ride.metrics.elapsedTimeMs)}</span>
                <span><Route size={14} />{ride.points.length} 个轨迹点</span>
              </div>
              <div className="ride-card-actions">
                <button onClick={() => downloadRideGpx(ride)}><Download size={16} />导出 GPX</button>
                <button className="delete-action" onClick={() => onDelete(ride.id)} aria-label="删除骑行记录"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
