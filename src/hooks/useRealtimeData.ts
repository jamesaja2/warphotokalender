'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Spot, Kelas, Settings, SystemStatus } from '@/types/database'
import { useServerTime } from './useServerTime'

export function useRealtimeData() {
  const { currentTime } = useServerTime()
  const [spots, setSpots] = useState<Spot[]>([])
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [settings, setSettings] = useState<Settings[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    active_users: 0,
    queue_length: 0,
    booking_active: false,
    booking_start_time: null
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    fetchInitialData()
    const cleanup = setupRealtimeSubscriptions()
    
    // Setup periodic updates for system status using server time
    const statusInterval = setInterval(() => {
      // Force update booking status every second to check if time has passed
      if (settings.length > 0 && mounted && currentTime) {
        updateSystemStatus(settings, currentTime)
      }
    }, 1000) // Update every second for real-time status
    
    // Update active users every 10 seconds
    const userInterval = setInterval(() => {
      if (mounted) {
        updateActiveUsers()
      }
    }, 10000)
    
    return () => {
      cleanup()
      clearInterval(statusInterval)
      clearInterval(userInterval)
    }
  }, [mounted, settings, currentTime]) // Add currentTime to dependency

  // Separate effect for settings changes to update status immediately
  useEffect(() => {
    if (settings.length > 0 && mounted && currentTime) {
      updateSystemStatus(settings, currentTime)
    }
  }, [settings, mounted, currentTime]) // Add currentTime

  async function fetchInitialData() {
    try {
      const [spotsResult, kelasResult, settingsResult] = await Promise.all([
        supabase.from('spots').select('*').order('id'),
        supabase.from('kelas').select('*').order('name'),
        supabase.from('settings').select('*')
      ])

      if (spotsResult.data) setSpots(spotsResult.data)
      if (kelasResult.data) setKelas(kelasResult.data)
      if (settingsResult.data) setSettings(settingsResult.data)

      // Update system status
      updateSystemStatus(settingsResult.data || [])
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper: konversi Date ke WIB
  function toJakartaTime(date: Date) {
    return new Date(date.getTime() + (7 * 60 * 60 * 1000));
  }

  function updateSystemStatus(settingsData: Settings[], wibTime?: Date) {
    const bookingTimeSetting = settingsData.find(s => s.key === 'booking_start_time')
    const bookingTime = bookingTimeSetting?.value

    let isBookingActive = false
    if (bookingTime) {
      // Gunakan waktu Jakarta untuk perbandingan
      const nowJakarta = toJakartaTime(wibTime || new Date())
      const startTimeJakarta = toJakartaTime(new Date(bookingTime))

      // Debug logs untuk troubleshooting
      console.log('=== BOOKING TIME CHECK (WIB) ===')
      console.log('Current Jakarta time:', nowJakarta.toISOString())
      console.log('Booking start time from DB:', bookingTime)
      console.log('Parsed booking time (WIB):', startTimeJakarta.toISOString())
      console.log('Should booking be active?', nowJakarta >= startTimeJakarta)
      console.log('Time difference (minutes):', (nowJakarta.getTime() - startTimeJakarta.getTime()) / (1000 * 60))
      console.log('========================')

      isBookingActive = nowJakarta >= startTimeJakarta
    }

    // Force re-render by using functional update to ensure component updates
    setSystemStatus(prev => {
      // Only update if there's actually a change to prevent unnecessary renders
      if (prev.booking_active !== isBookingActive || prev.booking_start_time !== (bookingTime || null)) {
        console.log('*** BOOKING STATUS CHANGED ***')
        console.log('Previous status:', prev.booking_active)
        console.log('New status:', isBookingActive)
        console.log('******************************')
        
        return {
          ...prev,
          booking_active: isBookingActive,
          booking_start_time: bookingTime || null
        }
      }
      return prev
    })
  }

  async function updateActiveUsers() {
    try {
      // More realistic simulation - users fluctuate based on time
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()
      
      // Peak hours simulation (lunch: 11-13, evening: 18-20)
      let baseUsers = 15
      if ((hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 20)) {
        baseUsers = 40 // Peak hours
      } else if (hour >= 7 && hour <= 17) {
        baseUsers = 25 // Normal hours
      } else {
        baseUsers = 10 // Off hours
      }
      
      // Add some randomness
      const variation = Math.floor(Math.random() * 20) - 10 // ±10 users
      const totalUsers = Math.max(5, baseUsers + variation)
      
      // Queue when booking is active and users > 30
      const queueLength = (systemStatus.booking_active && totalUsers > 30) 
        ? Math.floor(totalUsers * 0.3) // 30% of users in queue during peak
        : 0
      
      setSystemStatus(prev => ({
        ...prev,
        active_users: totalUsers,
        queue_length: queueLength
      }))
      
      console.log(`Active users: ${totalUsers}, Queue: ${queueLength}, Time: ${hour}:${minute}`)
    } catch (error) {
      console.error('Error updating active users:', error)
    }
  }

  function setupRealtimeSubscriptions() {
    // Subscribe to spots changes
    const spotsSubscription = supabase
      .channel('public:spots')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'spots'
      }, (payload) => {
        console.log('Spots changed:', payload)
        if (payload.eventType === 'UPDATE') {
          // Update specific spot immediately
          setSpots(prev => prev.map(spot => 
            spot.id === payload.new.id ? payload.new as Spot : spot
          ))
        } else if (payload.eventType === 'INSERT') {
          setSpots(prev => [...prev, payload.new as Spot])
        } else if (payload.eventType === 'DELETE') {
          setSpots(prev => prev.filter(spot => spot.id !== payload.old.id))
        }
      })
      .subscribe()

    // Subscribe to kelas changes
    const kelasSubscription = supabase
      .channel('public:kelas')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kelas'
      }, (payload) => {
        console.log('Kelas changed:', payload)
        if (payload.eventType === 'UPDATE') {
          // Update specific kelas immediately
          setKelas(prev => prev.map(k => 
            k.id === payload.new.id ? payload.new as Kelas : k
          ))
        } else if (payload.eventType === 'INSERT') {
          setKelas(prev => [...prev, payload.new as Kelas])
        } else if (payload.eventType === 'DELETE') {
          setKelas(prev => prev.filter(k => k.id !== payload.old.id))
        }
      })
      .subscribe()

    // Subscribe to settings changes
    const settingsSubscription = supabase
      .channel('public:settings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'settings'
      }, (payload) => {
        console.log('Settings changed:', payload)
        if (payload.eventType === 'UPDATE') {
          setSettings(prev => prev.map(s => 
            s.key === payload.new.key ? payload.new as Settings : s
          ))
          // Update system status immediately if booking time changed
          if (payload.new.key === 'booking_start_time') {
            const now = new Date()
            updateSystemStatus(settings.map(s => 
              s.key === payload.new.key ? payload.new as Settings : s
            ), now)
          }
        } else if (payload.eventType === 'INSERT') {
          setSettings(prev => [...prev, payload.new as Settings])
        }
      })
      .subscribe()

    // Setup presence tracking for active users
    const presenceChannel = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const onlineUsers = Object.keys(state).length
        setSystemStatus(prev => ({
          ...prev,
          active_users: onlineUsers,
          queue_length: Math.max(0, onlineUsers - 30)
        }))
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as online
          const userId = Math.random().toString(36).substring(2, 15)
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(spotsSubscription)
      supabase.removeChannel(kelasSubscription)
      supabase.removeChannel(settingsSubscription)
      supabase.removeChannel(presenceChannel)
    }
  }

  async function bookSpot(spotId: number, kelasId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Check if booking is active
      if (!systemStatus.booking_active) {
        return { success: false, message: 'Waktu booking belum dimulai!' }
      }

      // Check if class already booked
      const selectedKelas = kelas.find(k => k.id === kelasId)
      if (selectedKelas?.spot_id) {
        return { success: false, message: 'Kelas sudah memilih spot!' }
      }

      // Check spot capacity
      const selectedSpot = spots.find(s => s.id === spotId)
      if (!selectedSpot) {
        return { success: false, message: 'Spot tidak ditemukan!' }
      }

      if (selectedSpot.chosen_by.length >= selectedSpot.capacity) {
        return { success: false, message: 'Spot sudah penuh!' }
      }

      // Optimistic update - update UI immediately for instant feedback
      const oldSpotState = [...spots]
      const oldKelasState = [...kelas]
      
      setSpots(prev => prev.map(spot => 
        spot.id === spotId 
          ? { ...spot, chosen_by: [...spot.chosen_by, selectedKelas?.name || kelasId.toString()] }
          : spot
      ))
      
      setKelas(prev => prev.map(k => 
        k.id === kelasId 
          ? { ...k, spot_id: spotId }
          : k
      ))

      // Perform booking transaction
      const response = await fetch('/api/book-spot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotId,
          kelasId,
          kelasName: selectedKelas?.name || ''
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Revert optimistic update if booking failed
        setSpots(oldSpotState)
        setKelas(oldKelasState)
        return { success: false, message: result.error || 'Gagal melakukan booking' }
      }

      return { success: true, message: result.message || 'Berhasil booking spot!' }
    } catch (error) {
      console.error('Unexpected error:', error)
      return { success: false, message: 'Terjadi kesalahan sistem!' }
    }
  }

  return {
    spots,
    kelas,
    settings,
    systemStatus,
    loading,
    bookSpot,
    refetch: fetchInitialData
  }
}
