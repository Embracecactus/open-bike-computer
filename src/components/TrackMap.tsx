import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MapPin } from 'lucide-react-native'
import Svg, { Circle, Defs, Line, Pattern, Polyline, Rect } from 'react-native-svg'
import type { TrackPoint } from '../types'

interface TrackMapProps { points: TrackPoint[] }

export function TrackMap({ points }: TrackMapProps) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null
    const meanLatitude = points.reduce((sum, point) => sum + point.latitude, 0) / points.length
    const latitudeScale = Math.cos((meanLatitude * Math.PI) / 180)
    const projected = points.map((point) => ({ x: point.longitude * latitudeScale, y: point.latitude }))
    const xs = projected.map((point) => point.x)
    const ys = projected.map((point) => point.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const rangeX = Math.max(maxX - minX, 0.00001)
    const rangeY = Math.max(maxY - minY, 0.00001)
    const scale = Math.min(340 / rangeX, 250 / rangeY)
    const offsetX = (380 - rangeX * scale) / 2
    const offsetY = (290 - rangeY * scale) / 2
    const normalized = projected.map((point) => ({
      x: offsetX + (point.x - minX) * scale,
      y: 290 - (offsetY + (point.y - minY) * scale),
    }))
    return {
      polyline: normalized.map((point) => `${point.x},${point.y}`).join(' '),
      start: normalized[0],
      end: normalized.at(-1)!,
    }
  }, [points])

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View><Text style={styles.eyebrow}>LIVE TRACE</Text><Text style={styles.title}>实时轨迹</Text></View>
        <Text style={styles.count}>{points.length} 个定位点</Text>
      </View>
      <View style={styles.map}>
        <Svg width="100%" height="100%" viewBox="0 0 380 290">
          <Defs>
            <Pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
              <Line x1="25" y1="0" x2="0" y2="0" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <Line x1="0" y1="0" x2="0" y2="25" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            </Pattern>
          </Defs>
          <Rect width="380" height="290" fill="url(#grid)" />
          {geometry && (
            <>
              <Polyline points={geometry.polyline} fill="none" stroke="#020302" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <Polyline points={geometry.polyline} fill="none" stroke="#b8f20d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx={geometry.start.x} cy={geometry.start.y} r="5" fill="#0e100f" stroke="#edf0e8" strokeWidth="2" />
              <Circle cx={geometry.end.x} cy={geometry.end.y} r="10" fill="rgba(184,242,13,0.18)" />
              <Circle cx={geometry.end.x} cy={geometry.end.y} r="5" fill="#b8f20d" />
            </>
          )}
        </Svg>
        <Text style={styles.north}>N</Text>
        {!geometry && (
          <View style={styles.empty}>
            <MapPin color="#555b54" size={30} />
            <Text style={styles.emptyTitle}>{points.length ? '继续骑行以绘制轨迹' : '等待 GPS 轨迹'}</Text>
            <Text style={styles.emptyHint}>建议在室外开阔区域开始记录</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  eyebrow: { color: '#b8f20d', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#f1f3ed', fontSize: 29, fontWeight: '800', marginTop: 2 },
  count: { color: '#8b9189', fontSize: 10 },
  map: { flex: 1, minHeight: 350, borderRadius: 22, borderWidth: 1, borderColor: '#242824', backgroundColor: '#0d100e', overflow: 'hidden' },
  north: { position: 'absolute', right: 17, top: 15, color: '#737a72', fontSize: 14, fontWeight: '800' },
  empty: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { color: '#b7bcb5', fontSize: 14, fontWeight: '700' },
  emptyHint: { color: '#676d66', fontSize: 10 },
})
