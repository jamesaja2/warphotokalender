export interface Spot {
  id: number
  name: string
  capacity: number
  chosen_by: string[]
  created_at?: string
  updated_at?: string
}

export interface Kelas {
  id: number
  name: string
  spot_id: number | null
  created_at?: string
  updated_at?: string
}

export interface Settings {
  key: string
  value: string
  created_at?: string
  updated_at?: string
}

export interface QueueItem {
  id: number
  user_identifier: string
  position: number
  created_at: string
}

export interface SystemStatus {
  active_users: number
  queue_length: number
  booking_active: boolean
  booking_start_time: string | null
}
