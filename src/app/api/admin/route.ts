import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const [spots, kelas, settings] = await Promise.all([
      prisma.spot.findMany({ orderBy: { id: 'asc' } }),
      prisma.kelas.findMany({ orderBy: { name: 'asc' } }),
      prisma.settings.findMany()
    ])

    return NextResponse.json({
      spots,
      kelas,
      settings
    })

  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case 'update_booking_time':
        await prisma.settings.upsert({
          where: { key: 'booking_start_time' },
          update: { value: data.bookingTime },
          create: { key: 'booking_start_time', value: data.bookingTime }
        })
        return NextResponse.json({ success: true })

      case 'reset_bookings':
        await prisma.$transaction(async (tx: any) => {
          // Reset spots chosen_by
          await tx.spot.updateMany({
            data: { chosen_by: { set: [] } }
          })
          
          // Reset kelas spot_id
          await tx.kelas.updateMany({
            data: { spot_id: null }
          })

          // Delete all bookings
          await tx.booking.deleteMany()
        })
        return NextResponse.json({ success: true })

      case 'add_spot':
        await prisma.spot.create({
          data: {
            name: data.name,
            capacity: data.capacity,
            chosen_by: []
          }
        })
        return NextResponse.json({ success: true })

      case 'add_kelas':
        await prisma.kelas.create({
          data: {
            name: data.name,
            spot_id: null
          }
        })
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
