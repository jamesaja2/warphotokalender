import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await createClient(request)

    const [spotsResult, kelasResult, settingsResult] = await Promise.all([
      supabase.from('spots').select('*').order('id'),
      supabase.from('kelas').select('*').order('name'),
      supabase.from('settings').select('*')
    ])

    return NextResponse.json({
      spots: spotsResult.data || [],
      kelas: kelasResult.data || [],
      settings: settingsResult.data || []
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
    const { supabase } = await createClient(request)

    switch (action) {
      case 'update_booking_time':
        const { error: timeError } = await supabase
          .from('settings')
          .upsert({
            key: 'booking_start_time',
            value: data.bookingTime
          })

        if (timeError) throw timeError
        return NextResponse.json({ success: true })

      case 'reset_bookings':
        // Reset all spots
        const { data: spots } = await supabase.from('spots').select('id')
        if (spots) {
          await Promise.all(
            spots.map(spot =>
              supabase.from('spots').update({ chosen_by: [] }).eq('id', spot.id)
            )
          )
        }

        // Reset all kelas
        const { error: kelasError } = await supabase
          .from('kelas')
          .update({ spot_id: null })
          .neq('id', 0) // Update all

        if (kelasError) throw kelasError
        return NextResponse.json({ success: true })

      case 'add_spot':
        const { error: spotError } = await supabase
          .from('spots')
          .insert({
            name: data.name,
            capacity: data.capacity,
            chosen_by: []
          })

        if (spotError) throw spotError
        return NextResponse.json({ success: true })

      case 'add_kelas':
        const { error: kelasAddError } = await supabase
          .from('kelas')
          .insert({
            name: data.name,
            spot_id: null
          })

        if (kelasAddError) throw kelasAddError
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
