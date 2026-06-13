import { NextRequest, NextResponse } from 'next/server'
import { content as manualContent } from '@/data/manual'
import { content as tutorialContent } from '@/data/tutorial'

const DOCS: Record<string, string> = {
  manual: manualContent,
  tutorial: tutorialContent,
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "manual"
  const content = DOCS[type] || DOCS.manual

  return new NextResponse(JSON.stringify({ content, updated: new Date().toISOString() }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
}