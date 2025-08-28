'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar } from 'lucide-react'
import { useServerTime } from '@/hooks/useServerTime'

interface RealtimeClockProps {
  bookingStartTime: string | null
  onBookingStart?: () => void
}

export default function RealtimeClock({ bookingStartTime, onBookingStart }: RealtimeClockProps) {
  const { currentTime, loading, error } = useServerTime()
  const [timeUntilBooking, setTimeUntilBooking] = useState<string>('')
  const [isBookingActive, setIsBookingActive] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update countdown and booking status
  useEffect(() => {
    if (!mounted || !currentTime) return

    const timer = setInterval(() => {
      const now = currentTime
      
      if (bookingStartTime) {
        const bookingTime = new Date(bookingStartTime)
        const timeDiff = bookingTime.getTime() - now.getTime()

        if (timeDiff > 0) {
          // Before booking time
          const hours = Math.floor(timeDiff / (1000 * 60 * 60))
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
          
          setTimeUntilBooking(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
          setIsBookingActive(false)
        } else {
          // Booking time has passed
          if (!isBookingActive) {
            setIsBookingActive(true)
            onBookingStart?.()
          }
          setTimeUntilBooking('BOOKING AKTIF!')
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [mounted, currentTime, bookingStartTime, isBookingActive, onBookingStart])

  // Don't render time until mounted to avoid hydration mismatch
  if (!mounted || loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 space-y-2">
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Waktu Server (WIB)</span>
        </div>
        
        <div className="text-2xl font-mono font-bold text-gray-900">
          --:--:--
        </div>
        
        <div className="text-sm text-gray-500">
          Sinkronisasi waktu server...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 space-y-2">
        <div className="flex items-center space-x-2 text-red-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">❌ Gagal Sinkronisasi</span>
        </div>
        
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          <strong>PERINGATAN:</strong> Waktu tidak tersinkronisasi dengan server!<br/>
          <span className="text-xs">{error}</span>
        </div>
        
        <div className="text-xs text-red-500">
          ⚠️ Sistem mungkin tidak fair untuk semua user
        </div>
      </div>
    )
  }

  const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}:${currentTime.getSeconds().toString().padStart(2, '0')}`

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-2">
      <div className="flex items-center space-x-2 text-gray-600">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Waktu Server (Tersinkronisasi)</span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Semua user melihat waktu yang sama" />
      </div>
      
      <div className="text-2xl font-mono font-bold text-gray-900">
        {timeString}
      </div>
      
      <div className="text-sm text-gray-500">
        {currentTime.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>

      {bookingStartTime && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-sm text-gray-600 mb-1">
            Status Booking:
          </div>
          <div className={`text-lg font-semibold ${
            isBookingActive 
              ? 'text-green-600' 
              : 'text-orange-600'
          }`}>
            {timeUntilBooking}
          </div>
          {!isBookingActive && (
            <div className="text-xs text-gray-500 mt-1">
              Booking dimulai: {new Date(bookingStartTime).toLocaleString('id-ID', {
                hour12: false,
                timeZone: 'Asia/Jakarta'
              })}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">
        🎯 <strong>FAIR SYSTEM:</strong> Waktu server internal - semua device melihat countdown yang sama persis!
      </div>
    </div>
  )
}
