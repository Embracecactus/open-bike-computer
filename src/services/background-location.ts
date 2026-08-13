import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import { locationToTrackPoint } from '../domain/geo'
import type { TrackPoint } from '../types'

export const BACKGROUND_LOCATION_TASK = 'open-bike-computer-location'
const BUFFER_KEY = '@open-bike-computer/background-points/v1'
const MAX_BUFFERED_POINTS = 30_000

interface LocationTaskData {
  locations: Location.LocationObject[]
}

TaskManager.defineTask<LocationTaskData>(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data?.locations.length) return
  const existing = await readBufferedPoints()
  const incoming = data.locations.map(locationToTrackPoint)
  const combined = [...existing, ...incoming].slice(-MAX_BUFFERED_POINTS)
  await AsyncStorage.setItem(BUFFER_KEY, JSON.stringify(combined))
})

export async function requestLocationPermissions(): Promise<{
  foreground: boolean
  background: boolean
}> {
  const foreground = await Location.requestForegroundPermissionsAsync()
  if (foreground.status !== Location.PermissionStatus.GRANTED) {
    return { foreground: false, background: false }
  }

  const background = await Location.requestBackgroundPermissionsAsync()
  return {
    foreground: true,
    background: background.status === Location.PermissionStatus.GRANTED,
  }
}

export async function startBackgroundTracking(): Promise<void> {
  const active = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
  if (active) return

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    activityType: Location.ActivityType.Fitness,
    distanceInterval: 2,
    timeInterval: 1_000,
    deferredUpdatesDistance: 10,
    deferredUpdatesInterval: 5_000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: '正在记录骑行',
      notificationBody: 'Open Bike Computer 正在后台记录速度和轨迹',
      notificationColor: '#b8f20d',
      killServiceOnDestroy: false,
    },
  })
}

export async function stopBackgroundTracking(): Promise<void> {
  const active = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
  if (active) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
}

export async function readBufferedPoints(): Promise<TrackPoint[]> {
  const value = await AsyncStorage.getItem(BUFFER_KEY)
  return value ? (JSON.parse(value) as TrackPoint[]) : []
}

export async function clearBufferedPoints(): Promise<void> {
  await AsyncStorage.removeItem(BUFFER_KEY)
}
