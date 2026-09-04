'use client'

import { useEffect, useState, useCallback } from 'react'
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

  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch('/api/data')
      const result = await response.json()
      
      if (result.success) {
        setSpots(result.data.spots)
        setKelas(result.data.kelas)
        setSettings(result.data.settings)
        updateSystemStatus(result.data.settings)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchInitialData()
    
    // Polling API every 2 seconds instead of WebSockets
    const pollingInterval = setInterval(() => {
      if (mounted) {
        fetchInitialData()
      }
    }, 2000)
    
    const statusInterval = setInterval(() => {
      if (settings.length > 0 && mounted && currentTime) {
        updateSystemStatus(settings, currentTime)
        updateActiveUsers() // Simulate active users
      }
    }, 2000)
    
    return () => {
      clearInterval(pollingInterval)
      clearInterval(statusInterval)
    }
  }, [mounted, settings.length, currentTime, fetchInitialData])

  function toJakartaTime(utcDate: Date) {
    return new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
  }

  function updateSystemStatus(settingsData: Settings[], utcTime?: Date) {
    const bookingTimeSetting = settingsData.find(s => s.key === 'booking_start_time')
    const bookingTime = bookingTimeSetting?.value

    let isBookingActive = false
    if (bookingTime) {
      const nowJakarta = toJakartaTime(utcTime || new Date())
      const startTimeUTC = new Date(bookingTime)
      const startTimeJakarta = toJakartaTime(startTimeUTC)

      isBookingActive = nowJakarta >= startTimeJakarta
    }

    setSystemStatus(prev => {
      if (prev.booking_active !== isBookingActive || prev.booking_start_time !== (bookingTime || null)) {
        setTimeout(() => {
          setSystemStatus(current => ({
            ...current,
            booking_active: isBookingActive,
            booking_start_time: bookingTime || null
          }))
        }, 100)
        return prev
      }
      return prev
    })
  }

  async function updateActiveUsers() {
    try {
      const now = new Date()
      const hour = now.getHours()
      
      let baseUsers = 15
      if ((hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 20)) {
        baseUsers = 40
      } else if (hour >= 7 && hour <= 17) {
        baseUsers = 25
      } else {
        baseUsers = 10
      }
      
      const variation = Math.floor(Math.random() * 20) - 10
      const totalUsers = Math.max(5, baseUsers + variation)
      
      const queueLength = (systemStatus.booking_active && totalUsers > 30) 
        ? Math.floor(totalUsers * 0.3) 
        : 0
      
      setSystemStatus(prev => ({
        ...prev,
        active_users: totalUsers,
        queue_length: queueLength
      }))
    } catch (error) {
      console.error('Error updating active users:', error)
    }
  }

  async function bookSpot(spotId: number): Promise<{ success: boolean; message: string }> {
    try {
      if (!systemStatus.booking_active) {
        return { success: false, message: 'Waktu booking belum dimulai!' }
      }

      const selectedSpot = spots.find(s => s.id === spotId)
      if (!selectedSpot) {
        return { success: false, message: 'Spot tidak ditemukan!' }
      }

      if (selectedSpot.chosen_by.length >= selectedSpot.capacity) {
        return { success: false, message: 'Spot sudah penuh!' }
      }

      const response = await fetch('/api/book-spot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spotId })
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, message: result.error || 'Gagal melakukan booking' }
      }

      // Force instant refresh after successful booking
      fetchInitialData()

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
