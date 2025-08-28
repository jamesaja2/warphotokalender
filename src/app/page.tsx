'use client'

import { useState, useEffect } from 'react'
import { Camera, Users, Clock } from 'lucide-react'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import SpotCard from '@/components/SpotCard'
import SystemStatusCard from '@/components/SystemStatus'
import QueueDisplay from '@/components/QueueDisplay'
import RealtimeClock from '@/components/RealtimeClock'

export default function Home() {
  const { spots, kelas, systemStatus, loading, bookSpot } = useRealtimeData()
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showBookingAlert, setShowBookingAlert] = useState(false)

  // Ensure component is mounted before running client-side logic
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show alert when booking becomes active - improved logic
  useEffect(() => {
    if (systemStatus.booking_active && !showBookingAlert && mounted) {
      setShowBookingAlert(true)
      // Auto hide after 5 seconds
      setTimeout(() => setShowBookingAlert(false), 5000)
    }
  }, [systemStatus.booking_active, showBookingAlert, mounted])

  // Debug logging for booking status changes
  useEffect(() => {
    if (mounted) {
      console.log('=== BOOKING STATUS UPDATE ===')
      console.log('Booking Active:', systemStatus.booking_active)
      console.log('Booking Start Time:', systemStatus.booking_start_time)
      console.log('============================')
    }
  }, [systemStatus.booking_active, mounted])

  // Simulate queue system for high traffic
  useEffect(() => {
    if (!mounted) return // Don't run on server
    
    // Simulate checking user queue status
    const checkQueueStatus = () => {
      // Simulate queue logic - if more than 50 active users, put in queue
      if (systemStatus.active_users > 50) {
        const position = Math.floor(Math.random() * 20) + 1
        const waitTime = position * 10 // 10 seconds per position
        setQueuePosition(position)
        setEstimatedWaitTime(waitTime)
        
        // Simulate queue progression
        const interval = setInterval(() => {
          setQueuePosition(prev => {
            if (prev && prev > 1) {
              return prev - 1
            } else {
              setQueuePosition(null)
              setEstimatedWaitTime(0)
              clearInterval(interval)
              return null
            }
          })
        }, 10000) // Update every 10 seconds
        
        return () => clearInterval(interval)
      }
    }

    checkQueueStatus()
  }, [systemStatus.active_users, mounted])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat sistem rebutan spot foto...</p>
        </div>
      </div>
    )
  }

  const availableKelas = kelas.filter(k => k.spot_id === null)
  const bookedKelas = kelas.filter(k => k.spot_id !== null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Queue Display Overlay */}
      <QueueDisplay position={queuePosition} estimatedWaitTime={estimatedWaitTime} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sistem Rebutan Spot Foto
              </h1>
              <p className="text-gray-600 mt-1">
                Pilih spot foto terbaik untuk kelas Anda - Satu kelas, satu pilihan!
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Active Alert */}
        {showBookingAlert && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-green-800 text-xs font-bold">✓</span>
                </div>
              </div>
              <div>
                <h4 className="text-green-800 font-semibold">Booking Sekarang Aktif!</h4>
                <p className="text-green-700 text-sm mt-1">
                  Anda sekarang bisa mulai memilih spot foto. Jangan tunda, slot terbatas!
                </p>
              </div>
              <button 
                onClick={() => setShowBookingAlert(false)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Announcement Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-yellow-800 text-xs font-bold">!</span>
              </div>
            </div>
            <div>
              <h4 className="text-yellow-800 font-semibold">Penting!</h4>
              <p className="text-yellow-700 text-sm mt-1">
                Jangan refresh halaman ini! Sistem akan otomatis update ketika waktu booking dimulai. 
                Tetap di halaman ini untuk mendapatkan akses booking tercepat.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* System Status - spans 2 columns */}
          <div className="lg:col-span-2">
            <SystemStatusCard status={systemStatus} loading={loading} />
          </div>
          
          {/* Real-time Clock - spans 2 columns */}
          <div className="lg:col-span-2">
            <RealtimeClock 
              bookingStartTime={systemStatus.booking_start_time} 
              onBookingStart={() => {
                // Don't reload, just show notification
                console.log('Booking is now active!')
              }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Spot Foto</p>
                <p className="text-2xl font-bold text-gray-900">{spots.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Kelas Tersedia</p>
                <p className="text-2xl font-bold text-gray-900">{availableKelas.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Sudah Memilih</p>
                <p className="text-2xl font-bold text-gray-900">{bookedKelas.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Spots Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Daftar Spot Foto</h2>
          
          {spots.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada spot foto yang tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spots.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  kelas={kelas}
                  onBook={bookSpot}
                  bookingActive={systemStatus.booking_active}
                />
              ))}
            </div>
          )}
        </div>

        {/* Booked Classes Summary */}
        {bookedKelas.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Kelas yang Sudah Memilih</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookedKelas.map((k) => {
                const spot = spots.find(s => s.id === k.spot_id)
                return (
                  <div key={k.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-800">{k.name}</p>
                    <p className="text-sm text-green-600">
                      → {spot?.name || 'Spot tidak ditemukan'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-3">Petunjuk Penggunaan:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Setiap kelas hanya bisa memilih SATU spot foto</li>
            <li>• Setiap spot memiliki kapasitas terbatas</li>
            <li>• Booking hanya bisa dilakukan pada waktu yang telah ditentukan</li>
            <li>• Pilihan bersifat final dan tidak dapat diubah</li>
            <li>• Sistem akan update secara real-time</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            Sistem Rebutan Spot Foto - Dibuat dengan ❤️ oleh{' '}
            <a 
              href="https://github.com/jamesaja2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              James Timothy
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
