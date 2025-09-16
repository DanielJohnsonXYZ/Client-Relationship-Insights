import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { insightId, feedback } = body

    if (!insightId || !feedback || !['positive', 'negative'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { error } = await supabase
      .from('insights')
      .update({ feedback })
      .eq('id', insightId)

    if (error) {
      console.error('Error updating feedback:', error)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}