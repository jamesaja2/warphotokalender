import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { spotId, kelasId, kelasName } = await request.json()

    if (!spotId || !kelasId || !kelasName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { supabase } = await createClient(request)

    // Start a transaction-like operation
    // First, check current state
    const [spotResult, kelasResult] = await Promise.all([
      supabase.from('spots').select('*').eq('id', spotId).single(),
      supabase.from('kelas').select('*').eq('id', kelasId).single()
    ])

    if (spotResult.error || kelasResult.error) {
      return NextResponse.json(
        { error: 'Spot or Kelas not found' },
        { status: 404 }
      )
    }

    const spot = spotResult.data
    const kelas = kelasResult.data

    // Check if kelas already booked
    if (kelas.spot_id) {
      return NextResponse.json(
        { error: 'Kelas sudah memilih spot' },
        { status: 400 }
      )
    }

    // Check if spot is full
    if (spot.chosen_by.length >= spot.capacity) {
      return NextResponse.json(
        { error: 'Spot sudah penuh' },
        { status: 400 }
      )
    }

    // Check if kelas name already in spot (double check)
    if (spot.chosen_by.includes(kelasName)) {
      return NextResponse.json(
        { error: 'Kelas sudah terdaftar di spot ini' },
        { status: 400 }
      )
    }

    // Perform the booking
    const updatedChosenBy = [...spot.chosen_by, kelasName]

    const [updateSpotResult, updateKelasResult] = await Promise.all([
      supabase
        .from('spots')
        .update({ chosen_by: updatedChosenBy })
        .eq('id', spotId),
      supabase
        .from('kelas')
        .update({ spot_id: spotId })
        .eq('id', kelasId)
    ])

    if (updateSpotResult.error || updateKelasResult.error) {
      // Rollback logic would go here in a real transaction
      return NextResponse.json(
        { error: 'Failed to complete booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil!'
    })

  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
