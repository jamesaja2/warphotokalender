import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    // Bandingkan dengan environment variable yang hanya ada di server
    if (password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ success: false, error: 'Password salah' }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
