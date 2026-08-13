import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Download, History, Route, Timer, Trash2 } from 'lucide-react-native'
import { shareRideGpx } from '../domain/gpx'
import { formatDistance, formatDuration, formatRideDate, formatSpeed } from '../domain/format'
import type { RideRecord } from '../types'

interface RideHistoryProps { rides: RideRecord[]; onDelete: (id: string) => Promise<void> }

export function RideHistory({ rides, onDelete }: RideHistoryProps) {
  const confirmDelete = (id: string) => {
    Alert.alert('删除骑行记录', '这条本地记录删除后无法恢复。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => void onDelete(id) },
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heading}>
        <View><Text style={styles.eyebrow}>RIDE LOG</Text><Text style={styles.title}>骑行记录</Text></View>
        <Text style={styles.count}>{rides.length} 次骑行</Text>
      </View>
      {!rides.length ? (
        <View style={styles.empty}>
          <History color="#555b54" size={34} />
          <Text style={styles.emptyTitle}>还没有骑行记录</Text>
          <Text style={styles.emptyHint}>完成第一次骑行后，数据会安全保存在本机。</Text>
        </View>
      ) : rides.map((ride) => (
        <View style={styles.card} key={ride.id}>
          <View style={styles.cardTop}>
            <View><Text style={styles.date}>{formatRideDate(ride.startedAt)}</Text><Text style={styles.distance}>{formatDistance(ride.metrics.distanceM)}</Text></View>
            <Text style={styles.average}>{formatSpeed(ride.metrics.averageSpeedMps)} <Text style={styles.small}>km/h 均速</Text></Text>
          </View>
          <View style={styles.meta}>
            <View style={styles.metaItem}><Timer color="#8b9189" size={14} /><Text style={styles.metaText}>{formatDuration(ride.metrics.elapsedTimeMs)}</Text></View>
            <View style={styles.metaItem}><Route color="#8b9189" size={14} /><Text style={styles.metaText}>{ride.points.length} 个轨迹点</Text></View>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={() => void shareRideGpx(ride)}><Download color="#d8ddd5" size={16} /><Text style={styles.actionText}>分享 GPX</Text></Pressable>
            <Pressable style={styles.deleteButton} onPress={() => confirmDelete(ride.id)}><Trash2 color="#ff8d84" size={16} /></Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  eyebrow: { color: '#b8f20d', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#f1f3ed', fontSize: 29, fontWeight: '800', marginTop: 2 },
  count: { color: '#8b9189', fontSize: 10 },
  empty: { flex: 1, minHeight: 340, borderWidth: 1, borderStyle: 'dashed', borderColor: '#292d29', borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 9 },
  emptyTitle: { color: '#c4c8c1', fontSize: 14, fontWeight: '700' },
  emptyHint: { color: '#777d75', fontSize: 11, textAlign: 'center', maxWidth: 230, lineHeight: 17 },
  card: { backgroundColor: '#111411', borderWidth: 1, borderColor: '#242824', borderRadius: 18, padding: 15, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  date: { color: '#8b9189', fontSize: 10 },
  distance: { color: '#f1f3ed', fontSize: 27, fontWeight: '800', marginTop: 5 },
  average: { color: '#b8f20d', fontSize: 19, fontWeight: '800' },
  small: { color: '#8b9189', fontSize: 9, fontWeight: '500' },
  meta: { flexDirection: 'row', gap: 15, marginTop: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#8b9189', fontSize: 10 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#242824', marginTop: 14, paddingTop: 12 },
  actionButton: { minHeight: 36, borderRadius: 9, backgroundColor: '#202420', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#d8ddd5', fontSize: 11 },
  deleteButton: { marginLeft: 'auto', minHeight: 36, minWidth: 40, borderRadius: 9, backgroundColor: '#202420', alignItems: 'center', justifyContent: 'center' },
})
