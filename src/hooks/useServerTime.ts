'use client'

import { useState, useEffect, useRef } from 'react'

interface ServerTimeData {
  currentTime: Date
  loading: boolean
  error: string | null
}

export function useServerTime(): ServerTimeData {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Store the offset between server time and local time
  const timeOffsetRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasFetchedRef = useRef<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || hasFetchedRef.current) return

    // Function to fetch INTERNAL server time - SEKALI SAJA
    const fetchServerTime = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔄 Fetching server time from internal API...')

        // Fetch dari API internal kita sendiri - pasti bisa diakses
        const response = await fetch('/api/time', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }

        const data = await response.json()
        const serverTimestamp = parseInt(data.timestamp)
        const serverTime = new Date(serverTimestamp)
        const localTime = new Date()

        // Calculate offset between server time and local device time
        timeOffsetRef.current = serverTimestamp - localTime.getTime()
        
        // Set initial server time
        setCurrentTime(serverTime)
        setLoading(false)
        hasFetchedRef.current = true

        console.log('✅ SERVER TIME SYNCED (Internal API):', {
          serverTime: data.localString,
          deviceTime: localTime.toLocaleString('id-ID'),
          offset: `${timeOffsetRef.current}ms`,
          offsetMinutes: `${Math.round(timeOffsetRef.current / 1000 / 60)} minutes`
        })

        // Log untuk debugging sinkronisasi
        console.log('🎯 SYNC INFO:', {
          serverTimestamp,
          localTimestamp: localTime.getTime(),
          difference: timeOffsetRef.current,
          'Server ahead by': timeOffsetRef.current > 0 ? `${timeOffsetRef.current}ms` : 'Server is behind',
          'All users will see': data.localString
        })

      } catch (err) {
        console.error('❌ Failed to fetch internal server time:', err)
        setError(`Gagal sinkronisasi: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setLoading(false)
        
        // JANGAN fallback ke local time - ini yang menyebabkan tidak sync!
        // Biarkan error dan coba lagi
        setTimeout(() => {
          if (!hasFetchedRef.current) {
            fetchServerTime()
          }
        }, 2000) // Retry setelah 2 detik
      }
    }

    // Fetch server time HANYA SEKALI saat pertama kali mount
    fetchServerTime()

    // Update current time setiap detik menggunakan offset yang sudah dihitung
    intervalRef.current = setInterval(() => {
      const now = new Date()
      const adjustedTime = new Date(now.getTime() + timeOffsetRef.current)
      setCurrentTime(adjustedTime)
    }, 1000)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [mounted])

  return {
    currentTime,
    loading,
    error
  }
}
