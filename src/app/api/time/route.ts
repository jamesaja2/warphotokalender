import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Gunakan UTC time yang pasti benar
    const now = new Date()
    
    // Dapatkan waktu WIB yang benar untuk debug
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000))
    
    // Debug info lengkap
    console.log('🕐 Server Time Debug:', {
      serverUTC: now.toISOString(),
      serverTimestamp: now.getTime(),
      calculatedWIB: wibTime.toISOString(),
      wibString: wibTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    })
    
    return NextResponse.json({
      timestamp: now.getTime(),
      isoString: now.toISOString(),
      timezone: 'UTC',
      wib: {
        timestamp: wibTime.getTime(),
        isoString: wibTime.toISOString(),
        localeString: wibTime.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
      },
      debug: {
        serverUTC: now.toISOString(),
        calculatedWIB: wibTime.toISOString(),
        note: 'UTC + 7 hours = WIB'
      }
    })
  } catch (error) {
    console.error('Error getting server time:', error)
    return NextResponse.json(
      { error: 'Failed to get server time' },
      { status: 500 }
    )
  }
}
