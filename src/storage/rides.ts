import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RideRecord } from '../types'

const RIDES_KEY = '@open-bike-computer/rides/v1'

export async function saveRide(ride: RideRecord): Promise<void> {
  const rides = await listRides()
  const next = [ride, ...rides.filter((item) => item.id !== ride.id)]
  await AsyncStorage.setItem(RIDES_KEY, JSON.stringify(next))
}

export async function listRides(): Promise<RideRecord[]> {
  const value = await AsyncStorage.getItem(RIDES_KEY)
  if (!value) return []
  return (JSON.parse(value) as RideRecord[]).sort((a, b) => b.startedAt - a.startedAt)
}

export async function deleteRide(id: string): Promise<void> {
  const rides = await listRides()
  await AsyncStorage.setItem(RIDES_KEY, JSON.stringify(rides.filter((ride) => ride.id !== id)))
}
