'use client'

import { Clock, Users } from 'lucide-react'

interface QueueDisplayProps {
  position: number | null
  estimatedWaitTime: number
}

export default function QueueDisplay({ position, estimatedWaitTime }: QueueDisplayProps) {
  if (position === null) return null

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} detik`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} menit`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <Users className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Anda dalam Antrian</h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-orange-800 font-semibold">
              Posisi Anda: #{position}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600 inline mr-2" />
            <span className="text-blue-800">
              Perkiraan waktu tunggu: {formatWaitTime(estimatedWaitTime)}
            </span>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p>• Jangan tutup halaman ini</p>
          <p>• Anda akan otomatis masuk sistem saat giliran tiba</p>
          <p>• Traffic tinggi - mohon bersabar</p>
        </div>

        <div className="mt-6">
          <div className="animate-pulse bg-orange-200 h-2 rounded-full">
            <div className="bg-orange-500 h-2 rounded-full w-1/3"></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Memproses antrian...</p>
        </div>
      </div>
    </div>
  )
}
