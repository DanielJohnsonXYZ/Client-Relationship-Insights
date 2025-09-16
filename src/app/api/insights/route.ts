import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: insights, error } = await supabase
      .from('insights')
      .select(`
        id,
        category,
        summary,
        evidence,
        suggested_action,
        confidence,
        feedback,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching insights:', error)
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    return NextResponse.json({ insights: insights || [] })

  } catch (error) {
    console.error('Error in insights API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}