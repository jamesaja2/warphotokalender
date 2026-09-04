import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

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

    // 2. Fetch and Verify Class from External API using our helper
    const { getStudentInfo } = await import('@/lib/student')
    const studentInfo = await getStudentInfo(userEmail, userName)

    if (!studentInfo.success || !studentInfo.data) {
      return NextResponse.json({ error: studentInfo.error || 'Gagal memverifikasi data siswa' }, { status: 400 })
    }

    const kelasName = studentInfo.data.kelas_db
    const cleanUserName = studentInfo.data.name // Use the clean name from API

    // 3. Perform atomic booking transaction using Prisma
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Lock and find Spot
        // Prisma doesn't have native SELECT FOR UPDATE across all dialects via easy syntax,
        // but we can check state and fail safely, or use $queryRaw if needed.
        // For simplicity and safety, we fetch spot, kelas, and count.
        
        const spot = await tx.spot.findUnique({
          where: { id: spotId }
        })

        if (!spot) throw new Error('Spot tidak ditemukan')

        const kelas = await tx.kelas.findUnique({
          where: { name: kelasName }
        })

        if (!kelas) throw new Error(`Kelas ${kelasName} tidak ditemukan di database`)
        if (kelas.spot_id) throw new Error('Kelas sudah memilih spot')

        const bookingCount = await tx.booking.count({
          where: { spot_id: spotId }
        })

        if (bookingCount >= spot.capacity) throw new Error('Spot sudah penuh')

        // Create Booking
        await tx.booking.create({
          data: {
            spot_id: spotId,
            kelas_id: kelas.id,
            kelas_name: kelasName,
            user_name: cleanUserName,
            user_email: userEmail
          }
        })

        // Update Kelas
        await tx.kelas.update({
          where: { id: kelas.id },
          data: { spot_id: spotId }
        })

        // Update Spot (append to chosen_by array)
        const formattedString = `${kelasName} (oleh: ${cleanUserName})`
        await tx.spot.update({
          where: { id: spotId },
          data: {
            chosen_by: {
              push: formattedString
            }
          }
        })

        return { success: true }
      }, {
        isolationLevel: 'Serializable' // Prevents race conditions during War
      })

      return NextResponse.json({
        success: true,
        message: 'Booking berhasil!',
        details: {
          kelas: kelasName,
          user: userName
        }
      })
    } catch (txError: any) {
      console.error('Transaction Error:', txError)
      return NextResponse.json({ error: txError.message || 'Gagal melakukan booking (Conflict)' }, { status: 400 })
    }

  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
