import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [spots, kelas, settings] = await Promise.all([
      prisma.spot.findMany({ orderBy: { id: 'asc' } }),
      prisma.kelas.findMany({ orderBy: { name: 'asc' } }),
      prisma.settings.findMany()
    ])

    return NextResponse.json({
      success: true,
      data: {
        spots,
        kelas,
        settings
      }
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
