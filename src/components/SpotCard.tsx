'use client'

import { useState, memo, useEffect } from 'react'
import { Clock, Users, MapPin } from 'lucide-react'
import { Spot, Kelas } from '@/types/database'

interface SpotCardProps {
  spot: Spot
  kelas: Kelas[]
  onBook: (spotId: number) => Promise<{ success: boolean; message: string }>
  bookingActive: boolean
}

// Use memo to prevent unnecessary re-renders
const SpotCard = memo(function SpotCard({ spot, kelas, onBook, bookingActive }: SpotCardProps) {
  const [isBooking, setIsBooking] = useState(false)

  // Debug logging for booking status changes
  useEffect(() => {
    console.log(`=== SPOT CARD ${spot.name} ===`)
    console.log('Booking Active:', bookingActive)
    console.log('Spot ID:', spot.id)
    console.log('===========================')
  }, [bookingActive, spot.name, spot.id])

  // Pastikan bookingActive benar-benar boolean, tidak glitch
  const isBookingOpen = !!bookingActive
  const isSpotFull = spot.chosen_by.length >= spot.capacity
  const spotsRemaining = spot.capacity - spot.chosen_by.length

  const handleBook = async () => {
    if (isBooking) return

    if (!confirm(`Apakah Anda yakin ingin memilih spot "${spot.name}" untuk kelas Anda? Pilihan tidak dapat diubah.`)) {
      return
    }

    setIsBooking(true)
    try {
      const result = await onBook(spot.id)
      if (result.success) {
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
    <div className={`group bg-white rounded-2xl shadow-sm hover:shadow-xl p-7 border transition-all duration-300 transform hover:-translate-y-1 ${
      isSpotFull ? 'border-red-100 bg-red-50/30' : 'border-gray-100 hover:border-blue-200'
    }`}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isSpotFull ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 leading-tight">{spot.name}</h3>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4" />
            <span>Kapasitas: {spot.capacity} kelas</span>
          </div>
          <div className={`font-semibold px-3 py-1 rounded-full ${
            spotsRemaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {spotsRemaining > 0 ? `${spotsRemaining} sisa` : 'PENUH'}
          </div>
        </div>

        {spot.chosen_by.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dipesan oleh:</p>
            <div className="flex flex-col gap-2">
              {spot.chosen_by.map((bookingStr, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-800 text-xs px-3 py-2.5 rounded-lg border border-blue-100/50"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  {bookingStr}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isSpotFull && isBookingOpen && (
        <div className="mt-6 pt-2">
          <button
            onClick={handleBook}
            disabled={isBooking}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              !isBooking
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isBooking ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Pilih Spot Ini'
            )}
          </button>
        </div>
      )}

      {!isBookingOpen && (
        <div className="bg-amber-50 text-amber-700 p-3.5 rounded-xl text-center mt-6 text-sm font-medium flex items-center justify-center gap-2 border border-amber-200/50">
          <Clock className="w-4 h-4" />
          Booking belum dibuka
        </div>
      )}

      {isSpotFull && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-center mt-6 text-sm font-bold flex items-center justify-center gap-2 border border-red-100">
          Spot sudah penuh
        </div>
      )}
    </div>
  )
})

export default SpotCard
