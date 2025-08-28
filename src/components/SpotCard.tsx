'use client'

import { useState, memo, useEffect } from 'react'
import { Clock, Users, MapPin } from 'lucide-react'
import { Spot, Kelas } from '@/types/database'

interface SpotCardProps {
  spot: Spot
  kelas: Kelas[]
  onBook: (spotId: number, kelasId: number) => Promise<{ success: boolean; message: string }>
  bookingActive: boolean
}

// Use memo to prevent unnecessary re-renders
const SpotCard = memo(function SpotCard({ spot, kelas, onBook, bookingActive }: SpotCardProps) {
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null)
  const [isBooking, setIsBooking] = useState(false)

  // Debug logging for booking status changes
  useEffect(() => {
    console.log(`=== SPOT CARD ${spot.name} ===`)
    console.log('Booking Active:', bookingActive)
    console.log('Spot ID:', spot.id)
    console.log('===========================')
  }, [bookingActive, spot.name, spot.id])

  const availableKelas = kelas.filter(k => k.spot_id === null)
  const isSpotFull = spot.chosen_by.length >= spot.capacity
  const spotsRemaining = spot.capacity - spot.chosen_by.length

  const handleBook = async () => {
    if (!selectedKelas || isBooking) return

    setIsBooking(true)
    try {
      const result = await onBook(spot.id, selectedKelas)
      if (result.success) {
        setSelectedKelas(null)
        alert(result.message)
      } else {
        alert(result.message)
      }
    } catch (err) {
      console.error('Booking error:', err)
      alert('Terjadi kesalahan!')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 border-2 transition-all duration-300 ${
      isSpotFull ? 'border-red-300 bg-red-50' : 'border-green-300 hover:border-green-500'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-green-600" />
        <h3 className="text-xl font-bold text-gray-800">{spot.name}</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4" />
          <span>Kapasitas: {spot.capacity} kelas</span>
        </div>
        
        <div className={`text-sm font-medium ${
          spotsRemaining > 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {spotsRemaining > 0 ? `${spotsRemaining} slot tersisa` : 'PENUH'}
        </div>

        {spot.chosen_by.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Kelas yang sudah memilih:</p>
            <div className="flex flex-wrap gap-1">
              {spot.chosen_by.map((kelasName, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {kelasName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isSpotFull && bookingActive && availableKelas.length > 0 && (
        <div className="space-y-3">
          <select
            value={selectedKelas || ''}
            onChange={(e) => setSelectedKelas(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Pilih Kelas</option>
            {availableKelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleBook}
            disabled={!selectedKelas || isBooking}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              selectedKelas && !isBooking
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isBooking ? 'Memproses...' : 'Pilih Spot Ini'}
          </button>
        </div>
      )}

      {!bookingActive && (
        <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md text-center">
          <Clock className="w-4 h-4 inline mr-2" />
          Booking belum dibuka
        </div>
      )}

      {isSpotFull && (
        <div className="bg-red-100 text-red-800 p-3 rounded-md text-center">
          Spot sudah penuh
        </div>
      )}

      {bookingActive && availableKelas.length === 0 && !isSpotFull && (
        <div className="bg-gray-100 text-gray-600 p-3 rounded-md text-center">
          Semua kelas sudah memilih spot
        </div>
      )}
    </div>
  )
})

export default SpotCard
