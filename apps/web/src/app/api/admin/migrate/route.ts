import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/migrate
 *
 * 执行数据库 Migration。
 * 
 * 首先尝试用 service_role key 通过 Supabase SQL API 执行 DDL。
 * 如果 service_role key 未配置，返回 SQL 文本让用户手动跑。
 *
 * 安全: 仅允许已登录用户
 * 
 * Body (可选): { steps: string[] }
 *   指定要跑的 migration，不传则全部。可选: "schedules", "task_progress"
 */

const SUPABASE_SQL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/sql/v1/sql'

const MIGRATIONS: Record<string, string> = {
  schedules: `CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  skill_name text NOT NULL,
  input_template jsonb NOT NULL DEFAULT '{}',
  cron_expression text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'schedules' AND policyname = 'users: own schedules only'
  ) THEN
    CREATE POLICY "users: own schedules only"
      ON public.schedules FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS trigger AS $$ BEGIN new.updated_at = now(); RETURN new; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_schedules_updated_at ON public.schedules;
CREATE TRIGGER set_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION update_schedules_updated_at();`,
  
  task_progress: `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS progress text DEFAULT NULL;`,
}

export async function POST(request: NextRequest) {
  try {
    // 1. 只允许已登录用户
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const steps: string[] = body.steps ?? Object.keys(MIGRATIONS)

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // 2. 尝试自动执行（有 service_role_key 时）
    if (serviceRoleKey) {
      const results: Record<string, { success: boolean; error?: string }> = {}

      for (const step of steps) {
        const sql = MIGRATIONS[step]
        if (!sql) {
          results[step] = { success: false, error: `未知 migration: ${step}` }
          continue
        }

        try {
          const res = await fetch(SUPABASE_SQL_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ query: sql }),
          })

          if (res.ok) {
            results[step] = { success: true }
          } else {
            const text = await res.text()
            results[step] = {
              success: false,
              error: `API 返回 ${res.status}: ${text.substring(0, 300)}`,
            }
          }
        } catch (fetchErr) {
          results[step] = {
            success: false,
            error: `请求失败: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
          }
        }
      }

      return NextResponse.json({ results })
    }

    // 3. 无 service_role_key 时返回 SQL 文本供手动执行
    const sqlMap: Record<string, string> = {}
    for (const step of steps) {
      if (MIGRATIONS[step]) {
        sqlMap[step] = MIGRATIONS[step]
      }
    }

    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY 未配置',
      manualSql: sqlMap,
      hint: '1. 打开 https://supabase.com/dashboard/project/hbnaqcjpdabicpyzoagp/sql/new\n2. 粘贴 SQL 并运行\n3. 或在 Vercel 添加环境变量 SUPABASE_SERVICE_ROLE_KEY 实现自动迁移',
    }, { status: 400 })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 })
  }
}
