"""
seed_via_api.py — inserts preset skills via Supabase REST API using a service role key.
Run: python scripts/seed_via_api.py <SERVICE_ROLE_KEY>
"""
import sys
import json
import urllib.request
import urllib.error

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
            {"name": "focus", "label": "重点分析方向", "type": "select", "options": ["竞品楼盘", "周边地块", "整体市场行情", "全部"], "required": False},
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
            {"name": "client_name", "label": "客户名称/类型", "type": "text", "placeholder": "例：某中型开发商", "required": True},
            {"name": "pain_point", "label": "核心痛点", "type": "textarea", "placeholder": "例：销售去化慢，客户画像不清晰", "required": True},
            {"name": "budget_range", "label": "预算范围（可选）", "type": "text", "placeholder": "例：50-100万", "required": False},
            {"name": "timeline", "label": "期望交付时间（可选）", "type": "text", "placeholder": "例：3个月内", "required": False},
        ],
        "prompt": """你是一名资深商业咨询顾问，专注于房地产营销和销售领域的解决方案设计。

根据用户提供的客户信息，生成一份专业的解决方案建议书，结构如下：

## 客户现状理解
- 用1-2段话概括客户的核心挑战和背景

## 我们的解决方案
### 方案概述
核心思路（一句话）

### 三大核心模块
针对痛点设计3个可落地的模块，每个模块包含：模块名称、解决的具体问题、主要交付内容、预期效果

## 实施路径
分阶段的实施计划（建议3个阶段），每阶段里程碑

## 投资回报预估
量化的预期收益（尽量给出数字区间），ROI估算逻辑

## 为什么选择我们
3个差异化优势

## 下一步行动
明确的下一步建议""",
        "enabled": True,
    },
    {
        "user_id": USER_ID,
        "name": "公司背景调研",
        "description": "输入公司名称，快速生成工商摘要、业务分析和风险提示",
        "form_fields": [
            {"name": "company_name", "label": "公司名称", "type": "text", "placeholder": "例：碧桂园控股有限公司", "required": True},
            {"name": "purpose", "label": "调研目的", "type": "select", "options": ["客户背调", "合作伙伴评估", "竞品研究", "投资参考"], "required": True},
        ],
        "prompt": """你是一名商业尽调分析师。用户会提供公司名称和调研目的，请生成一份结构化的公司背景报告。

## 基本信息
公司全称、注册地、成立时间、注册资本、实际控制人/股权结构、经营范围摘要

## 业务概况
主营业务和核心产品/服务、市场定位和主要客户群、近年重要动态

## 财务健康度（基于公开信息）
营收规模估算、已知的财务风险点

## 风险提示
经营风险、法律/诉讼风险（如有公开记录）、行业风险

## 综合评价
针对【调研目的】给出1-2段综合判断和建议

⚠️ 声明：以上分析基于公开信息，建议结合企查查、天眼查等工具进行数据核实。""",
        "enabled": True,
    },
    {
        "user_id": USER_ID,
        "name": "营销文案生成",
        "description": "输入项目卖点，生成朋友圈/公众号/短视频多版本营销文案",
        "form_fields": [
            {"name": "project_name", "label": "项目/产品名称", "type": "text", "placeholder": "例：光明云谷·未来社区", "required": True},
            {"name": "selling_points", "label": "核心卖点", "type": "textarea", "placeholder": "例：地铁上盖、学区房、精装交付", "required": True},
            {"name": "target_audience", "label": "目标客群", "type": "text", "placeholder": "例：30-45岁改善型购房者", "required": False},
            {"name": "format", "label": "文案类型", "type": "select", "options": ["朋友圈文案（3版）", "公众号推文开头", "短视频脚本（30秒）", "全部格式"], "required": True},
        ],
        "prompt": """你是一名资深房地产营销策划，擅长创作有感染力的营销文案。

根据用户提供的项目信息，按要求格式生成文案：

**朋友圈文案**（如需要）：
生成3个版本：版本1情感共鸣型、版本2数据说话型、版本3制造稀缺型。每版150字以内，附2-3个emoji。

**公众号推文开头**（如需要）：
200-300字，包含钩子、共鸣和悬念。

**短视频脚本**（如需要）：
30秒口播：开场钩子(3秒)、核心内容(20秒)、行动号召(7秒)，标注画面建议。

语言要求：接地气、有共鸣、避免过度商业感。""",
        "enabled": True,
    },
    {
        "user_id": USER_ID,
        "name": "环境自检助手",
        "description": "检测本地 Python/Playwright 环境，自动安装缺失依赖或给出操作指引",
        "form_fields": [
            {"name": "action", "label": "操作", "type": "select", "options": ["检查环境状态", "安装 Playwright", "安装全部依赖", "生成排查报告"], "required": True},
        ],
        "prompt": """你是一名本地环境配置助手。用户不懂技术，帮助他们检查和配置爬虫运行所需的环境。

根据用户选择的操作执行：

**检查环境状态：** 依次执行 python --version、pip --version、python -c "import playwright; print('OK')"，以✅/❌格式汇报。

**安装 Playwright：** 执行 pip install playwright 然后 python -m playwright install chromium，验证并告知结果。

**安装全部依赖：** 执行 pip install playwright requests beautifulsoup4 lxml 然后 python -m playwright install chromium。

**生成排查报告：** 检查操作系统、Python路径、已安装包，给出诊断建议。

注意：用友好的中文解释，失败时给出可直接复制粘贴到 PowerShell/CMD 的命令。""",
        "enabled": True,
    },
]


def insert_skills(service_role_key: str):
    url = f"{SUPABASE_URL}/rest/v1/skills"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    for skill in SKILLS:
        data = json.dumps(skill).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                print(f"[OK] Inserted: {skill['name']} (id: {result[0]['id']})")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            print(f"[FAIL] {skill['name']} - {e.code}: {body[:200]}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python seed_via_api.py <SERVICE_ROLE_KEY>")
        print("\nGet your service role key from:")
        print("  Supabase Dashboard -> Project Settings -> API -> service_role key")
        sys.exit(1)

    insert_skills(sys.argv[1])
