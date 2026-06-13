import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const filePath = join(process.cwd(), '..', '..', 'docs', '用户使用手册.md')
    const content = await readFile(filePath, 'utf-8')
    return NextResponse.json({ content, updated: new Date().toISOString() })
  } catch {
    return NextResponse.json({ error: '手册文件未找到' }, { status: 404 })
  }
}