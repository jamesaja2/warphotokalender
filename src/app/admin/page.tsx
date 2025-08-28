'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Clock, Users, RefreshCw, Shield, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Spot, Kelas } from '@/types/database'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [spots, setSpots] = useState<Spot[]>([])
  const [kelas, setKelas] = useState<Kelas[]>([])
  const [message, setMessage] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated (simple session check)
    const isAuth = localStorage.getItem('admin_authenticated') === 'true'
    setIsAuthenticated(isAuth)
    
    if (isAuth) {
      fetchData()
    }
  }, []) // Empty dependency array is intentional for initial auth check

  async function handleLogin() {
    // Simple password check - in production, use proper authentication
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      fetchData()
      setMessage('Login berhasil!')
    } else {
      setMessage('Password salah!')
    }
  }

  async function fetchData() {
    setLoading(true)
    try {
      const [spotsResult, kelasResult, settingsResult] = await Promise.all([
        supabase.from('spots').select('*').order('id'),
        supabase.from('kelas').select('*').order('name'),
        supabase.from('settings').select('*').eq('key', 'booking_start_time')
      ])

      if (spotsResult.data) setSpots(spotsResult.data)
      if (kelasResult.data) setKelas(kelasResult.data)
      if (settingsResult.data && settingsResult.data[0]) {
        setBookingTime(settingsResult.data[0].value)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage('Error mengambil data!')
    } finally {
      setLoading(false)
    }
  }

  async function updateBookingTime() {
    if (!bookingTime) {
      setMessage('Masukkan waktu booking yang valid!')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'booking_start_time',
          value: bookingTime
        })

      if (error) throw error
      setMessage('Waktu booking berhasil diupdate!')
    } catch (error) {
      console.error('Error updating booking time:', error)
      setMessage('Error mengupdate waktu booking!')
    } finally {
      setLoading(false)
    }
  }

  async function resetAllBookings() {
    if (!confirm('Yakin ingin reset semua booking? Tindakan ini tidak dapat dibatalkan!')) {
      return
    }

    setLoading(true)
    try {
      // Reset spot chosen_by
      const resetSpotsPromises = spots.map(spot =>
        supabase.from('spots').update({ chosen_by: [] }).eq('id', spot.id)
      )

      // Reset kelas spot_id
      const resetKelasPromises = kelas.map(k =>
        supabase.from('kelas').update({ spot_id: null }).eq('id', k.id)
      )

      await Promise.all([...resetSpotsPromises, ...resetKelasPromises])
      
      setMessage('Semua booking berhasil direset!')
      fetchData()
    } catch (error) {
      console.error('Error resetting bookings:', error)
      setMessage('Error mereset booking!')
    } finally {
      setLoading(false)
    }
  }

  async function addSpot(name: string, capacity: number) {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('spots')
        .insert({ name, capacity, chosen_by: [] })

      if (error) throw error
      setMessage('Spot berhasil ditambahkan!')
      fetchData()
    } catch (error) {
      console.error('Error adding spot:', error)
      setMessage('Error menambahkan spot!')
    } finally {
      setLoading(false)
    }
  }

  async function addKelas(name: string) {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('kelas')
        .insert({ name, spot_id: null })

      if (error) throw error
      setMessage('Kelas berhasil ditambahkan!')
      fetchData()
    } catch (error) {
      console.error('Error adding kelas:', error)
      setMessage('Error menambahkan kelas!')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setIsAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
    setPassword('')
    setMessage('')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600">Masukkan password untuk mengakses panel admin</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Password Admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-md text-center ${
              message.includes('berhasil') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Kembali ke Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const bookedKelas = kelas.filter(k => k.spot_id !== null)
  const availableKelas = kelas.filter(k => k.spot_id === null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('berhasil') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Kelas</p>
                <p className="text-2xl font-bold">{kelas.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Spot</p>
                <p className="text-2xl font-bold">{spots.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Sudah Booking</p>
                <p className="text-2xl font-bold">{bookedKelas.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Belum Booking</p>
                <p className="text-2xl font-bold">{availableKelas.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Time Control */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pengaturan Waktu Booking</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waktu Mulai Booking
              </label>
              <input
                type="datetime-local"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={updateBookingTime}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Waktu'}
            </button>
          </div>
        </div>

        {/* Reset Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Kontrol Reset</h2>
          <div className="flex gap-4">
            <button
              onClick={resetAllBookings}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Semua Booking
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Quick Add Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Add Spot */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tambah Spot Foto</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const name = formData.get('spot_name') as string
              const capacity = parseInt(formData.get('spot_capacity') as string)
              if (name && capacity) {
                addSpot(name, capacity)
                ;(e.target as HTMLFormElement).reset()
              }
            }}>
              <div className="space-y-3">
                <input
                  name="spot_name"
                  type="text"
                  placeholder="Nama Spot (e.g., Pohon Cinta)"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
                <input
                  name="spot_capacity"
                  type="number"
                  placeholder="Kapasitas (e.g., 3)"
                  min="1"
                  max="10"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Tambah Spot
                </button>
              </div>
            </form>
          </div>

          {/* Add Kelas */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tambah Kelas</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const name = formData.get('kelas_name') as string
              if (name) {
                addKelas(name)
                ;(e.target as HTMLFormElement).reset()
              }
            }}>
              <div className="space-y-3">
                <input
                  name="kelas_name"
                  type="text"
                  placeholder="Nama Kelas (e.g., X-A, X-B, XI-IPA-1)"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Tambah Kelas
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Current Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spots Table */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Daftar Spot Foto</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nama</th>
                    <th className="text-left py-2">Kapasitas</th>
                    <th className="text-left py-2">Terisi</th>
                  </tr>
                </thead>
                <tbody>
                  {spots.map((spot) => (
                    <tr key={spot.id} className="border-b">
                      <td className="py-2">{spot.name}</td>
                      <td className="py-2">{spot.capacity}</td>
                      <td className="py-2">{spot.chosen_by.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kelas Table */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status Kelas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Kelas</th>
                    <th className="text-left py-2">Spot</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kelas.map((k) => {
                    const spot = spots.find(s => s.id === k.spot_id)
                    return (
                      <tr key={k.id} className="border-b">
                        <td className="py-2">{k.name}</td>
                        <td className="py-2">{spot?.name || '-'}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            k.spot_id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {k.spot_id ? 'Sudah Booking' : 'Belum Booking'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
