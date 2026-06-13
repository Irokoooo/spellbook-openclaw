// /api/skill-import — Import a Skill from GitHub URL or raw file URL
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '请提供有效的 URL' }, { status: 400 })
    }

    // Convert GitHub URL to raw content URL
    let rawUrl = url

    // GitHub repo URL → try to find SKILL.md
    if (url.includes('github.com')) {
      // https://github.com/user/repo → https://raw.githubusercontent.com/user/repo/main/SKILL.md
      const match = url.match(/github\.com\/([^/]+\/[^/]+?)(?:\/|$)/)
      if (match) {
        const repo = match[1].replace(/\.git$/, '')
        // Try SKILL.md first, then skill.json
        for (const file of ['SKILL.md', 'skill.json', 'skill.yaml']) {
          const testUrl = `https://raw.githubusercontent.com/${repo}/main/${file}`
          const res = await fetch(testUrl)
          if (res.ok) {
            rawUrl = testUrl
            break
          }
          // Try master branch
          const testUrlMaster = `https://raw.githubusercontent.com/${repo}/master/${file}`
          const resMaster = await fetch(testUrlMaster)
          if (resMaster.ok) {
            rawUrl = testUrlMaster
            break
          }
        }
      }
    }

    // Fetch the file content
    const response = await fetch(rawUrl)
    if (!response.ok) {
      return NextResponse.json({
        error: `无法获取文件 (${response.status})。请确保 URL 正确且仓库为公开。`,
      }, { status: 400 })
    }

    const text = await response.text()
    const filename = rawUrl.split('/').pop() || 'SKILL.md'

    // Basic parse (extract name, description, prompt)
    const lines = text.split('\n').map((l: string) => l.trim())
    let name = ''
    let description = ''
    let promptStart = -1

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      if (l.startsWith('# ') && !name) name = l.slice(2).trim()
      if ((l.startsWith('## ') && l.toLowerCase().includes('description')) && i + 1 < lines.length) {
        description = lines[i + 1]
      }
      if ((l.startsWith('## ') && l.toLowerCase().includes('prompt')) || (l.includes('##') && l.toLowerCase().includes('prompt'))) {
        promptStart = i + 1
      }
    }

    const prompt = promptStart > 0 ? lines.slice(promptStart).join('\n').trim() : text
    if (!name) name = filename.replace(/\.(md|json|yaml)$/i, '').replace(/[-_]/g, ' ')

    return NextResponse.json({
      skill: {
        name,
        description: description || '从 GitHub 导入的 Skill',
        form_fields: [],
        prompt,
      },
    })
  } catch (err) {
    return NextResponse.json({
      error: '导入失败：' + (err instanceof Error ? err.message : String(err)),
    }, { status: 500 })
  }
}
