'use client'

import { Clock, Users, Activity } from 'lucide-react'
import { SystemStatus } from '@/types/database'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { memo } from 'react'
import { useServerTime } from '@/hooks/useServerTime'

interface SystemStatusProps {
  status: SystemStatus
  loading: boolean
}

// Use memo to prevent unnecessary re-renders
const SystemStatusCard = memo(function SystemStatusCard({ status, loading }: SystemStatusProps) {
  const { currentTime } = useServerTime()
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  const formatBookingTime = (timeString: string | null) => {
    if (!timeString) return 'Belum ditentukan'
    try {
      return format(new Date(timeString), 'dd MMMM yyyy, HH:mm', { locale: id })
    } catch {
      return 'Format tanggal tidak valid'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-600" />
        Status Sistem
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Clock className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm text-gray-600">Waktu Buka Booking</p>
            <p className="text-lg font-semibold text-gray-800">
              {status.booking_start_time ? formatBookingTime(status.booking_start_time) : 'Belum ditentukan'}
            </p>
            <p className="text-xs text-gray-500">
              WIB (UTC+7)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Pengguna Aktif</p>
            <p className="text-lg font-semibold text-gray-800">{status.active_users}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Clock className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-sm text-gray-600">Antrian</p>
            <p className="text-lg font-semibold text-gray-800">{status.queue_length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Activity className={`w-5 h-5 ${status.booking_active ? 'text-green-600' : 'text-red-600'}`} />
          <div>
            <p className="text-sm text-gray-600">Status Booking</p>
            <p className={`text-sm font-semibold ${
              status.booking_active ? 'text-green-600' : 'text-red-600'
            }`}>
              {status.booking_active ? 'AKTIF' : 'BELUM AKTIF'}
            </p>
          </div>
        </div>
      </div>

      {status.booking_start_time && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <Clock className="w-4 h-4 inline mr-2" />
            Waktu booking: {formatBookingTime(status.booking_start_time)}
          </p>
        </div>
      )}

      {!status.booking_active && status.booking_start_time && (
        <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Booking akan dimulai pada waktu yang telah ditentukan di atas
          </p>
        </div>
      )}
    </div>
  )
})

export default SystemStatusCard
