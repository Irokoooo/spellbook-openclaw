import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const DOCS: Record<string, string> = {
  manual: "\u7528\u6237\u4f7f\u7528\u624b\u518c.md",
  tutorial: "Agent\u5b89\u88c5\u6559\u7a0b.md",
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "manual"
  const filename = DOCS[type] || DOCS.manual

  try {
    const filePath = join(process.cwd(), "..", "..", "docs", filename)
    const content = await readFile(filePath, "utf-8")
    return new NextResponse(JSON.stringify({ content, updated: new Date().toISOString() }), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  } catch {
    return NextResponse.json({ error: "\u6587\u4ef6\u672a\u627e\u5230" }, { status: 404 })
  }
}