import { useMemo } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import type { TrackPoint } from '../types'

interface TrackMapProps {
  points: TrackPoint[]
}

export function TrackMap({ points }: TrackMapProps) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null

    const meanLatitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length
    const latitudeScale = Math.cos((meanLatitude * Math.PI) / 180)
    const projected = points.map((point) => ({
      x: point.longitude * latitudeScale,
      y: point.latitude,
    }))
    const xs = projected.map((point) => point.x)
    const ys = projected.map((point) => point.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const rangeX = Math.max(maxX - minX, 0.00001)
    const rangeY = Math.max(maxY - minY, 0.00001)
    const padding = 22
    const width = 400 - padding * 2
    const height = 250 - padding * 2
    const scale = Math.min(width / rangeX, height / rangeY)
    const contentWidth = rangeX * scale
    const contentHeight = rangeY * scale
    const offsetX = (400 - contentWidth) / 2
    const offsetY = (250 - contentHeight) / 2
    const normalized = projected.map((point) => ({
      x: offsetX + (point.x - minX) * scale,
      y: 250 - (offsetY + (point.y - minY) * scale),
    }))

    return {
      path: normalized.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '),
      start: normalized[0],
      end: normalized.at(-1)!,
    }
  }, [points])

  return (
    <section className="track-card" aria-label="骑行轨迹">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LIVE TRACE</span>
          <h2>实时轨迹</h2>
        </div>
        <span className="sample-count">{points.length} 个定位点</span>
      </div>

      <div className="track-canvas">
        <svg viewBox="0 0 400 250" role="img" aria-label="当前骑行轨迹图">
          <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,.055)" strokeWidth="1" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="400" height="250" fill="url(#grid)" />
          {geometry && (
            <>
              <path className="track-shadow" d={geometry.path} />
              <path className="track-line" d={geometry.path} />
              <circle className="track-start" cx={geometry.start.x} cy={geometry.start.y} r="5" />
              <circle className="track-end-pulse" cx={geometry.end.x} cy={geometry.end.y} r="11" />
              <circle className="track-end" cx={geometry.end.x} cy={geometry.end.y} r="5" />
            </>
          )}
        </svg>

        {!geometry && (
          <div className="track-empty">
            {points.length === 0 ? <Navigation size={28} /> : <MapPin size={28} />}
            <strong>{points.length === 0 ? '等待 GPS 轨迹' : '继续骑行以绘制轨迹'}</strong>
            <span>建议在室外开阔区域开始记录</span>
          </div>
        )}
      </div>
    </section>
  )
}
