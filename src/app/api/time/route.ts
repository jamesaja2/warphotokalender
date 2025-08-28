import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Kirim waktu UTC server - frontend yang konversi ke WIB
    const now = new Date()
    
    // Debug info
    console.log('🕐 Server Time Debug (UTC):', {
      serverUTC: now.toISOString(),
      serverTimestamp: now.getTime()
    })
    
    return NextResponse.json({
      timestamp: now.getTime(),
      isoString: now.toISOString(),
      timezone: 'UTC',
      debug: {
        serverUTC: now.toISOString(),
        note: 'Frontend will convert to WIB'
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
