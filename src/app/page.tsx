'use client'

import { useState, useEffect } from 'react'
import { Camera, Users, Clock } from 'lucide-react'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import SpotCard from '@/components/SpotCard'
import SystemStatusCard from '@/components/SystemStatus'
import QueueDisplay from '@/components/QueueDisplay'
import RealtimeClock from '@/components/RealtimeClock'
import { useSession, signOut } from 'next-auth/react'

export default function Home() {
  const { spots, kelas, systemStatus, loading, bookSpot } = useRealtimeData()
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showBookingAlert, setShowBookingAlert] = useState(false)
  
  const { data: userSession, status } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

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
  }, [systemStatus.booking_active, systemStatus.booking_start_time, mounted])

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

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat sistem WAR Tema Kalender...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, redirect to login (handled by middleware usually, but just in case)
  if (status === 'unauthenticated' && mounted) {
    window.location.href = '/login'
    return null
  }

  const availableKelas = kelas.filter(k => k.spot_id === null)
  const bookedKelas = kelas.filter(k => k.spot_id !== null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Queue Display Overlay */}
      <QueueDisplay position={queuePosition} estimatedWaitTime={estimatedWaitTime} />

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-md">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                WAR Tema Kalender
              </h1>
              <p className="text-sm sm:text-base text-gray-500 font-medium">
                Pilih tema terbaik untuk kelas Anda
              </p>
            </div>
          </div>
          
          {userSession && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userSession.user?.name || userSession.user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500">{userSession.user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          )}
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
                  Anda sekarang bisa mulai memilih tema.
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
                Sistem akan otomatis update ketika waktu booking dimulai.
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
                <p className="text-sm text-gray-600">Total Tema</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Daftar Tema</h2>
          
          {spots.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada tema yang tersedia</p>
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
            <li>• Setiap kelas hanya bisa memilih SATU tema</li>
            <li>• Setiap tema memiliki kapasitas terbatas</li>
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
            WAR Tema Kalender
          </p>
        </div>
      </footer>
    </div>
  )
}
