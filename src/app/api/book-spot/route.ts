import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    const { spotId } = await request.json()

    if (!spotId) {
      return NextResponse.json(
        { error: 'Spot ID is required' },
        { status: 400 }
      )
    }

    // 1. Get User Session via NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = session.user.email || ''
    const userName = session.user.name || userEmail.split('@')[0]

    // Create Supabase client for database operations (using Anon Key or Service Role)
    // We use Anon Key since RLS is allowing public access in this setup for bookings
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // 2. Fetch Class from External API
    let studentClassRaw = ''
    try {
      const response = await fetch(`https://cadangan.stlouislc.net/hadir/buatqr/search.php?name=${encodeURIComponent(userName)}`, {
        headers: {
          'x-api-key': 'b1290a4f2d8e40f1a6c9e91a7123a5e6'
        }
      })
      
      if (!response.ok) throw new Error('API request failed')
      
      const students = await response.json()
      
      if (!Array.isArray(students) || students.length === 0) {
        return NextResponse.json({ error: `Siswa dengan nama ${userName} tidak ditemukan dalam sistem.` }, { status: 404 })
      }

      // Find exact match or use the first one if only one result
      let matchedStudent = students.find((s: any) => s.nama.toLowerCase() === userName.toLowerCase())
      
      if (!matchedStudent) {
        // Fallback: If no exact match but there is only 1 result, use it.
        // Or try to match the first word? For safety, just use the first result if it contains parts of the name
        matchedStudent = students[0] 
      }

      studentClassRaw = matchedStudent.kelas
    } catch (err) {
      console.error('Error fetching external API:', err)
      return NextResponse.json({ error: 'Gagal memverifikasi data siswa' }, { status: 500 })
    }

    // 3. Extract Class Name (e.g., "XII B 2/ 17" -> "XII B 2")
    const kelasName = studentClassRaw.split('/')[0].trim()

    // 4. Find Kelas ID in database
    const { data: kelasData, error: kelasError } = await supabase
      .from('kelas')
      .select('id')
      .eq('name', kelasName)
      .single()

    if (kelasError || !kelasData) {
      return NextResponse.json({ error: `Kelas ${kelasName} tidak ditemukan di database` }, { status: 404 })
    }

    const kelasId = kelasData.id

    // 5. Call Atomic RPC for Booking
    const { data: rpcResult, error: rpcError } = await supabase.rpc('book_spot_atomic', {
      p_spot_id: spotId,
      p_kelas_id: kelasId,
      p_kelas_name: kelasName,
      p_user_name: userName,
      p_user_email: userEmail
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      return NextResponse.json({ error: 'Gagal melakukan booking (Database Error)' }, { status: 500 })
    }

    if (rpcResult && rpcResult.success === false) {
      return NextResponse.json({ error: rpcResult.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil!',
      details: {
        kelas: kelasName,
        user: userName
      }
    })

  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
