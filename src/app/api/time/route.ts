import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Gunakan server time Node.js dan pastikan kita dapat WIB yang benar
    const now = new Date()
    
    // Method 1: Gunakan toLocaleString untuk mendapat waktu Jakarta yang tepat
    const jakartaTimeString = now.toLocaleString('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    // Parse kembali untuk mendapat Date object yang benar
    const jakartaDate = new Date(jakartaTimeString)
    
    // Debug info
    console.log('🕐 Server Time Debug:', {
      serverUTC: now.toISOString(),
      serverLocal: now.toString(),
      jakartaString: jakartaTimeString,
      jakartaTimestamp: jakartaDate.getTime(),
      jakartaISO: jakartaDate.toISOString()
    })
    
    return NextResponse.json({
      timestamp: jakartaDate.getTime(),
      isoString: jakartaDate.toISOString(),
      localString: jakartaTimeString,
      timezone: 'Asia/Jakarta',
      debug: {
        serverUTC: now.toISOString(),
        serverLocal: now.toString(),
        offset: '+07:00'
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
