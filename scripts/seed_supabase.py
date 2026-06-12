"""
seed_supabase.py — seeds preset SpellBook skills using Supabase Python client.
Works with the service role key, bypassing RLS.

Usage:
    cd E:\\Coding\\SpellBook_OpenClaw
    pip install supabase
    python scripts/seed_supabase.py <SERVICE_ROLE_KEY>
"""
import sys
import os

# Add local-agent venv site-packages to path if available
venv_site = os.path.join(os.path.dirname(__file__), '..', 'apps', 'local-agent', 'venv',
                          'Lib', 'site-packages')
if os.path.isdir(venv_site):
    sys.path.insert(0, os.path.abspath(venv_site))

from supabase import create_client

SUPABASE_URL = "https://hbnaqcjpdabicpyzoagp.supabase.co"
USER_ID = "6ed94b0a-e81e-4906-98c3-a30c92959f1a"

SKILLS = [
    {
        "user_id": USER_ID,
        "name": "市场盘点助手",
        "description": "输入项目名称和城市，分析竞品楼盘、地块和市场行情",
        "form_fields": [
            {"name": "project_name", "label": "项目名称", "type": "text", "placeholder": "例：光明新城", "required": True},
            {"name": "city", "label": "城市", "type": "text", "placeholder": "例：深圳", "required": True},
            {"name": "focus", "label": "重点分析方向", "type": "select",
             "options": ["竞品楼盘", "周边地块", "整体市场行情", "全部"], "required": False},
        ],
        "prompt": """你是一名资深房地产市场分析师，擅长从公开信息中提炼市场洞察。

用户会提供项目名称、城市和关注方向。请按以下结构输出分析报告：

## 市场概况
- 该城市/区域当前房地产市场状态（供需、政策背景）

## 竞品分析
- 周边3-5个主要竞品项目
- 每个竞品：名称、定位、价格区间、优劣势

## 地块信息
- 近期成交或挂牌的相关地块
- 土地性质、面积、楼面价估算

## 市场机会与风险
- 2-3个核心机会点
- 2-3个主要风险点

## 建议
- 针对该项目的差异化建议

注意：请基于你的知识给出分析框架和典型判断，明确标注哪些是需要实地核实的数据。""",
        "enabled": True,
    },
    {
        "user_id": USER_ID,
        "name": "解决方案撰写",
        "description": "根据客户背景和核心痛点，生成结构化业务解决方案文档",
        "form_fields": [
            {"name": "client_name", "label": "客户名称/类型", "type": "text",
             "placeholder": "例：某中型开发商", "required": True},
            {"name": "pain_point", "label": "核心痛点", "type": "textarea",
             "placeholder": "例：销售去化慢，客户画像不清晰", "required": True},
            {"name": "budget_range", "label": "预算范围（可选）", "type": "text",
             "placeholder": "例：50-100万", "required": False},
            {"name": "timeline", "label": "期望交付时间（可选）", "type": "text",
             "placeholder": "例：3个月内", "required": False},
        ],
        "prompt": """你是一名资深商业咨询顾问，专注于房地产营销和销售领域的解决方案设计。

根据用户提供的客户信息，生成一份专业的解决方案建议书：

## 客户现状理解
用1-2段话概括客户的核心挑战和背景

## 我们的解决方案

### 方案概述
核心思路（一句话）

### 三大核心模块
针对痛点设计3个可落地的模块，每个包含：模块名称、解决的具体问题、主要交付内容、预期效果

## 实施路径
分阶段实施计划（建议3个阶段），每阶段里程碑

## 投资回报预估
量化预期收益（给出数字区间），ROI估算逻辑

## 为什么选择我们
3个差异化优势

## 下一步行动
明确的下一步建议（如：安排需求深访、提供Demo演示等）

语言风格：专业但不晦涩，有说服力，站在客户利益角度出发。""",
        "enabled": True,
    },
    {
        "user_id": USER_ID,
        "name": "公司背景调研",
        "description": "输入公司名称，快速生成工商摘要、业务分析和风险提示",
        "form_fields": [
            {"name": "company_name", "label": "公司名称", "type": "text",
             "placeholder": "例：碧桂园控股有限公司", "required": True},
            {"name": "purpose", "label": "调研目的", "type": "select",
             "options": ["客户背调", "合作伙伴评估", "竞品研究", "投资参考"], "required": True},
        ],
        "prompt": """你是一名商业尽调分析师。用户会提供公司名称和调研目的，请生成一份结构化的公司背景报告。

## 基本信息
公司全称、注册地、成立时间、注册资本、实际控制人/股权结构、经营范围摘要

## 业务概况
主营业务和核心产品/服务、市场定位和主要客户群、近年重要动态（融资、并购、战略调整等）

## 财务健康度（基于公开信息）
营收规模估算、已知的财务风险点（如债务问题）

## 风险提示
经营风险、法律/诉讼风险（如有公开记录）、行业风险

## 综合评价
针对【调研目的】给出1-2段综合判断和建议

声明：以上分析基于公开信息，建议结合企查查、天眼查等工具进行数据核实。""",
        "enabled": True,
    },
    {
        "user_id": USER_ID,
        "name": "营销文案生成",
        "description": "输入项目卖点，生成朋友圈/公众号/短视频多版本营销文案",
        "form_fields": [
            {"name": "project_name", "label": "项目/产品名称", "type": "text",
             "placeholder": "例：光明云谷·未来社区", "required": True},
            {"name": "selling_points", "label": "核心卖点", "type": "textarea",
             "placeholder": "例：地铁上盖、学区房、精装交付", "required": True},
            {"name": "target_audience", "label": "目标客群", "type": "text",
             "placeholder": "例：30-45岁改善型购房者", "required": False},
            {"name": "format", "label": "文案类型", "type": "select",
             "options": ["朋友圈文案（3版）", "公众号推文开头", "短视频脚本（30秒）", "全部格式"], "required": True},
        ],
        "prompt": """你是一名资深房地产营销策划，擅长创作有感染力的营销文案。

根据用户提供的项目信息，按要求格式生成文案：

**朋友圈文案**（如需要）：
生成3个不同风格的版本：
- 版本1：情感共鸣型（戳痛点/讲故事）
- 版本2：数据说话型（用数字和事实）
- 版本3：制造稀缺型（限时/限量感）
每版控制在150字以内，附带2-3个适合的emoji。

**公众号推文开头**（如需要）：
生成200-300字的引人入胜的开头，包含钩子、共鸣和引导继续阅读的悬念。

**短视频脚本**（如需要）：
30秒口播脚本，包含：开场钩子(3秒)、核心内容(20秒)、行动号召(7秒)，标注画面建议。

语言要求：接地气、有共鸣、避免过度商业感。""",
        "enabled": True,
    },
    {
        "user_id": USER_ID,
        "name": "环境自检助手",
        "description": "检测本地 Python/Playwright 环境，自动安装缺失依赖或给出操作指引",
        "form_fields": [
            {"name": "action", "label": "操作", "type": "select",
             "options": ["检查环境状态", "安装 Playwright", "安装全部依赖", "生成排查报告"], "required": True},
        ],
        "prompt": """你是一名本地环境配置助手。用户不懂技术，帮助他们检查和配置爬虫运行所需的环境。

根据用户选择的操作执行对应任务：

**检查环境状态：**
依次执行：python --version、pip --version、python -c "import playwright; print('OK')"
以 OK/FAIL 格式汇报每项结果。

**安装 Playwright：**
执行 pip install playwright，然后 python -m playwright install chromium，验证并告知用户结果。

**安装全部依赖：**
执行 pip install playwright requests beautifulsoup4 lxml，然后 python -m playwright install chromium。
安装完成后列出每个包的安装状态。

**生成排查报告：**
检查操作系统（platform.platform()）、Python路径（where python）、已安装包（pip list），给出诊断建议。

注意：用友好的中文解释每步，失败时给出可直接复制到 PowerShell/CMD 运行的命令。""",
        "enabled": True,
    },
]


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/seed_supabase.py <SERVICE_ROLE_KEY>")
        print()
        print("Get your service role key from:")
        print("  Supabase Dashboard -> Project Settings -> API -> service_role key")
        sys.exit(1)

    service_key = sys.argv[1]
    client = create_client(SUPABASE_URL, service_key)

    # Check if skills already exist for this user
    existing = client.table("skills").select("id, name").eq("user_id", USER_ID).execute()
    if existing.data:
        print(f"Found {len(existing.data)} existing skills for this user.")
        names = [s["name"] for s in existing.data]
        new_skills = [s for s in SKILLS if s["name"] not in names]
        if not new_skills:
            print("All skills already exist. Nothing to insert.")
            return
        print(f"Inserting {len(new_skills)} new skills...")
        skills_to_insert = new_skills
    else:
        skills_to_insert = SKILLS

    for skill in skills_to_insert:
        resp = client.table("skills").insert(skill).execute()
        if resp.data:
            print(f"[OK] {skill['name']} (id: {resp.data[0]['id']})")
        else:
            print(f"[FAIL] {skill['name']}")

    print("\nDone.")


if __name__ == "__main__":
    main()
