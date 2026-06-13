import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('danmaku_comments')
    .select('id, content, color, created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.reverse() ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const body = await request.json()
  const { content, color } = body as { content: string; color?: string }

  if (!content?.trim()) return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
  if (content.length > 120) return NextResponse.json({ error: '最多 120 字' }, { status: 400 })

  const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#AAE3E2']
  const randomColor = color || colors[Math.floor(Math.random() * colors.length)]

  const { data, error } = await supabase
    .from('danmaku_comments')
    .insert({ content: content.trim(), color: randomColor, user_id: user.id })
    .select('id, content, color, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}