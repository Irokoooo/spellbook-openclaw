# SpellBook 寮€鍙戣繘搴?
> 鏈€鍚庢洿鏂帮細2026-06-09

---

## 宸插畬鎴?
### 鍩虹妗嗘灦
- [x] 椤圭洰鐩綍缁撴瀯锛坢onorepo锛宎pps/web + apps/local-agent + packages/shared锛?- [x] Next.js 15 App Router 鎼缓锛孴ailwindCSS + shadcn/ui
- [x] Supabase 瀹㈡埛绔厤缃紙browser + server 涓ゅ锛?- [x] TypeScript 绫诲瀷瀹氫箟锛圓gent銆丼kill銆乀ask銆丮essage 绛夛級
- [x] 鍩虹甯冨眬锛氫晶杈规爮瀵艰埅锛圫idebar锛? AgentStatusBadge

### 鐢ㄦ埛璁よ瘉
- [x] Supabase Auth 闆嗘垚
- [x] 鐧诲綍椤甸潰锛?login锛?- [x] 娉ㄥ唽椤甸潰锛?register锛?- [x] Auth 璺敱甯冨眬闅旂锛?auth) 璺敱缁勶級

### 鑱婂ぉ鐣岄潰锛?chat锛?- [x] 鑷劧璇█瀵硅瘽鐣岄潰锛孉I 鍔╂墜閫氳繃瀵硅瘽鏀堕泦浠诲姟鍙傛暟
- [x] SSE 娴佸紡杈撳嚭
- [x] 娆㈣繋椤靛揩鎹峰缓璁叆鍙?- [x] 蹇€?娣卞害鎬濊€冩ā寮忓垏鎹紙`thinkingMode: off | high`锛?- [x] Realtime 璁㈤槄锛氫换鍔＄姸鎬佸彉鏇村疄鏃跺弽鏄犲埌 TaskResult 鍗＄墖
- [x] 澶氳疆瀵硅瘽鐘舵€佺淮鎶わ紙sessionId + collectedFields锛?- [x] TaskResult 缁勪欢锛氬睍绀轰换鍔＄姸鎬併€佽緭鍏ャ€佽緭鍑?
### 璺敱 API
- [x] `/api/chat`锛氳皟鐢?OpenClaw 鍋?Skill 璺敱 + 鍙傛暟鏀堕泦锛岃В鏋?ACTION:SUBMIT 瑙﹀彂浠诲姟
- [x] `/api/skill-workshop`锛欰I 寮曞鐢熸垚 Skill 閰嶇疆锛圫SE + 澶氶樁娈佃繘搴︼級

### Skill 绠＄悊锛?skills锛?- [x] Skill 鍒楄〃椤碉細鍚敤/绂佺敤銆佺紪杈戙€佸垹闄?- [x] SkillEditor 缁勪欢锛氭柊寤?缂栬緫 Skill锛堝悕绉般€佹弿杩般€乫orm_fields銆乸rompt锛?- [x] Skill 宸ュ潑锛?skills/workshop锛夛細AI 瀵硅瘽寮忕敓鎴?Skill锛屽彸渚ч瑙堥潰鏉匡紝涓€閿繚瀛?
### 浠诲姟涓績锛?tasks锛?- [x] 浠诲姟鍒楄〃锛屾寜 all / active / completed / failed 绛涢€?- [x] 浠诲姟灞曞紑璇︽儏锛堣緭鍏ャ€佽緭鍑恒€侀敊璇級
- [x] 鍙栨秷闃熷垪涓殑浠诲姟
- [x] Realtime 瀹炴椂璁㈤槄锛圛NSERT + UPDATE锛?
### 璁剧疆椤碉紙/settings锛?- [x] 璐﹀彿淇℃伅灞曠ず
- [x] Agent 娉ㄥ唽锛堝垱寤恒€佸鍒?ID銆佸垹闄わ級
- [x] Agent 鍦ㄧ嚎/鎵ц涓?绂荤嚎鐘舵€佸睍绀?
### OpenClaw 闆嗘垚
- [x] `runOpenclaw()` 灏佽锛歴pawn node 鐩存帴璋冪敤 .mjs锛岀粫杩?Windows shell 鍒嗚瘝闂
- [x] 鏀寔 `--session-id`銆乣--thinking`銆乣--json` 鍙傛暟

---

## 寰呭畬鎴?
### 鏈湴 Agent锛坅pps/local-agent锛?- [ ] Python FastAPI 妗嗘灦鎼缓
- [ ] Supabase 杩炴帴锛堜换鍔¤疆璇?or Realtime 鎺ㄩ€侊級
- [ ] 蹇冭烦涓婃姤锛堟瘡 30s 鏇存柊 agent.status + last_seen锛?- [ ] 浠诲姟鎷夊彇涓庢墽琛岋紙璋冪敤鏈湴 OpenClaw CLI锛?- [ ] 浠诲姟缁撴灉鍥炰紶锛坥utput / error / status 鈫?Supabase锛?- [ ] 绂荤嚎浠诲姟鎺掗槦鎭㈠锛堜笂绾垮悗鎸?created_at 椤哄簭鎵ц queued 浠诲姟锛?- [ ] PyInstaller 鎵撳寘鎴?exe

### Supabase 鏁版嵁搴?- [ ] 寤鸿〃 SQL 鑴氭湰锛坲sers / agents / tasks / skills锛?- [ ] RLS 绛栫暐閰嶇疆
- [ ] 鏁版嵁搴撹縼绉绘枃浠舵暣鐞?
### 鍔熻兘琛ュ叏
- [ ] Skill 琛ㄥ崟锛氭敮鎸?select 绫诲瀷鐨勪笅鎷夐€夐」缂栬緫
- [ ] 浠诲姟杈撳嚭 Markdown 娓叉煋锛堝綋鍓嶄负绾枃鏈?pre锛?- [ ] Agent 绂荤嚎瓒呮椂鑷姩鏍囪锛坙ast_seen > 60s 鈫?offline锛屽缓璁敤 Supabase Edge Function 鎴?pg cron锛?- [ ] 绉诲姩绔搷搴斿紡閫傞厤锛堜晶杈规爮鎶樺彔锛?
### 閮ㄧ讲
- [ ] Vercel 鐜鍙橀噺閰嶇疆锛圢EXT_PUBLIC_SUPABASE_URL 绛夛級
- [ ] 鏈湴 Agent 瀹夎/鍚姩鏂囨。
- [ ] .env.example 瀹屾暣濉啓

---

## 褰撳墠涓昏宸ヤ綔椤?
1. **鎼缓 local-agent**锛氳繖鏄暣涓摼璺腑鍞竴杩樻病鍔ㄧ殑閮ㄥ垎銆俉eb 绔换鍔℃彁浜ゅ凡閫氾紝涓嬩竴姝ラ渶瑕?Python Agent 鎶婁换鍔＄湡姝ｈ窇璧锋潵銆?2. **鏁版嵁搴撳垵濮嬪寲鑴氭湰**锛歋upabase 琛ㄧ粨鏋勭洰鍓嶅彧鏈夌被鍨嬪畾涔夛紝缂哄皯鍙墽琛岀殑寤鸿〃 SQL銆?
---

## 鎶€鏈€?
| 椤?| 鎻忚堪 |
|----|------|
| Realtime RLS | tasks 鐨?Realtime 璁㈤槄闇€瑕?RLS 绛栫暐鍏佽鐢ㄦ埛鍙敹鍒拌嚜宸?agent 鐨勫彉鏇?|
| proxy.ts | `apps/web/src/proxy.ts` 鐢ㄩ€斿緟纭 |
| skill-workshop session | 宸ュ潑鐨?OpenClaw session 鍜?chat 鐨?session 鏄嫭绔嬬殑锛屾病鏈変簰閫?|

---

## 2026-06-12 GitHub 鎺ㄩ€?
- **鍔ㄤ綔**锛氬畬鎴愰」鐩垵濮嬫彁浜ゅ苟鎺ㄩ€佸埌 GitHub
- **浠撳簱**锛歔github.com/Irokoooo/spellbook-openclaw](https://github.com/Irokoooo/spellbook-openclaw)
- **鍒嗘敮**锛歮ain
- **鎻愪氦**锛?4 涓枃浠讹紝鍚?web銆乴ocal-agent銆乨ocs銆乻cripts
- **閰嶇疆**锛欸it 鍏ㄥ眬鐢ㄦ埛淇℃伅宸插啓鍏ュ叏灞€鎺у埗鍙?

---

## 2026-06-12 鍚姩 & Vercel 閮ㄧ讲

- **鍔ㄤ綔**锛氬惎鍔ㄥ紑鍙戞湇鍔″櫒 + 閮ㄧ讲鍒?Vercel
- **鏈湴**锛歨ttp://localhost:3000锛圢ext.js 16.2.7 + Webpack锛?- **鐢熶骇**锛歨ttps://web-rho-puce-53.vercel.app
- **Vercel 椤圭洰**锛歴erahinas-projects/web锛堝凡杩炴帴 GitHub锛?- **鐜鍙橀噺**锛氬凡閰嶇疆 NEXT_PUBLIC_SUPABASE_URL銆丯EXT_PUBLIC_SUPABASE_ANON_KEY銆丯EXT_PUBLIC_APP_URL
- **鏋勫缓鐘舵€?*锛氣渽 14 涓〉闈㈠叏閮ㄧ紪璇戞垚鍔?- **娉ㄦ剰**锛歷ercel.json 浠庢牴鐩綍绉诲埌 apps/web锛岀Щ闄や簡鏃犳晥鐨?rootDirectory 瀛楁

---

## 2026-06-12 Claude 涓婚绯荤粺 & 閲嶆柊閮ㄧ讲

- **鍔ㄤ綔**锛氬悎骞?Claude 寮€鍙戠殑涓変富棰樼郴缁燂紝鎻愪氦鎺ㄩ€佸苟閲嶆柊閮ㄧ讲鍒?Vercel
- **鎻愪氦**锛?b3bcc6 - add @playwright/test dev dependency
- **涓変富棰?*锛氶粯璁わ紙閿岃壊+绱綏鍏帮級銆佸吀绫?Grimoire锛堟殫妫曢粦+閲戣壊+Cormorant Garamond 瀛椾綋锛夈€佸伐鍧?Studio锛堟殩濂舵补+璧ら櫠+Nunito 瀛椾綋锛?- **涓婚鍒囨崲**锛氫晶杈规爮搴曢儴鍒囨崲鎸夐挳锛屽惊鐜垏鎹紝localStorage 鎸佷箙鍖栵紝鏃?hydration 闂儊
- **楠岃瘉**锛歅laywright 鎴浘纭涓変釜涓婚鍦ㄧ敓浜х幆澧冩覆鏌撴纭?- **鏋勫缓鎬ц兘**锛氱紦瀛樺懡涓紝鏋勫缓鏃堕棿浠?39s 闄嶈嚦 26s

---

## 2026-06-12 Codex 鍏ㄥ姛鑳芥繁搴︽祴璇?
- **鍔ㄤ綔**锛氱敤璐﹀彿 2436698411@qq.com 娣卞害娴嬭瘯鐢熶骇鐜鍚勫姛鑳?- **鐜**锛歨ttps://web-rho-puce-53.vercel.app锛圴ercel 鐢熶骇閮ㄧ讲锛?- **娴嬭瘯宸ュ叿**锛歂ode REPL + Playwright 鑷姩鍖?
### 娴嬭瘯缁撴灉

| 鍔熻兘 | 缁撴灉 | 璇︽儏 |
|------|------|------|
| 鐧诲綍/娉ㄥ唽 | 鉁?PASS | Supabase Auth 姝ｅ父锛?chat 椤甸潰鍔犺浇 |
| 鑱婂ぉ瀵硅瘽 | 鉁?PASS | 娑堟伅鍙戦€併€佹祦寮忓搷搴旀甯?|
| Skill 绠＄悊 | 鉁?PASS | 5 涓?Skills 宸插垱寤猴細甯傚満鐩樼偣鍔╂墜銆佸叕鍙歌儗鏅皟鐮斻€佽惀閿€鏂囨鐢熸垚銆佺幆澧冭嚜妫€鍔╂墜銆佽В鍐虫柟妗堟挵鍐?|
| Skill 宸ュ潑 | 鉁?PASS | /skills/workshop 椤甸潰姝ｅ父 |
| 浠诲姟绯荤粺 | 鉁?PASS | /tasks 椤甸潰鍔犺浇姝ｅ父 |
| 璁剧疆椤?| 鉁?PASS | 璐﹀彿淇℃伅銆丄gent 娉ㄥ唽锛?efb146d锛夈€丄gent 鍦ㄧ嚎鐘舵€佹甯?|
| 涓変富棰樺垏鎹?| 鉁?PASS | 榛樿鈫掑吀绫嶁啋宸ュ潑鈫掗粯璁?寰幆鍒囨崲锛宒ata-theme 灞炴€у彉鍖栨纭紝鏃?UI 闂儊 |

### 鏈湴 vs 閮ㄧ讲瀵规瘮
- 鏈湴 dev server (localhost:3000) 涓庣敓浜?(Vercel) UI 瀹屽叏涓€鑷?- 鑳屾櫙鑹层€佹牱寮忚〃銆乨ata-theme 灞炴€у潎鍖归厤
- Vercel 鏋勫缓缂撳瓨鍛戒腑锛岄儴缃叉甯?
### 寰呭姙
- [ ] DeepSeek API Key锛氶渶鍦?DeepSeek 鎺у埗鍙板垹闄ゆ硠闇茬殑 Key锛岀敓鎴愭柊 Key 骞舵洿鏂板埌 ~/.openclaw/.env
- [ ] .env.local 骞插噣锛屾棤纭紪鐮?Key锛?gitignore 宸叉纭拷鐣?.claude/ 鍜?.env*
- [ ] 鏈湴 Agent (Python) 灏氭湭瀹夎杩愯锛堜笅娆℃祴璇曢噸鐐癸級
## 2026-06-12 测试修复 & 全功能验证

- **动作**：修复聊天功能 + 全面测试生产环境
- **环境**：https://web-rho-puce-53.vercel.app（Vercel web 项目）
- **测试工具**：Node REPL + Playwright 自动化 + Vercel CLI

### 问题与修复

| 问题 | 根因 | 修复 |
|------|------|------|
| 聊天报"AI_API_KEY 环境变量未配置" | Vercel 生产环境缺少 AI_API_KEY | 通过 ercel env add 添加 AI_API_KEY、AI_BASE_URL、AI_MODEL 到 web 和 spellbook-openclaw 项目 |
| 聊天返回"404 status code (no body)" | echo sk-xxx | vercel env add 添加的 env var 末尾有换行符，导致 OpenAI SDK 拼接 URL 变成 .../v1\n/chat/completions | 用 --value <val> 参数重配所有 env var（无尾随空白） |
| 部署到错误的 Vercel 项目 | 根目录 .vercel 关联 spellbook-openclaw，pps/web/.vercel 关联 web，两个项目共用一个域名 | 确认两个项目都配了 env var |

### 测试结果

| 功能 | 结果 | 详情 |
|------|------|------|
| 登录/注册 | ? PASS | Supabase Auth 正常，跳转 /chat |
| 聊天对话（简单） | ? PASS | "哈喽，测试" -> AI 生成计划 -> 确认执行 -> AI 回复完整 |
| 聊天对话（房产场景） | ? PASS | 深圳南山商业地产竞品盘点 -> AI 输出四大模块分析框架（知己/知彼/知势/知需）+ 执行路径建议 |
| Skill 管理 | ? PASS | 5 个 Skills 展示（市场盘点/背景调研/营销文案/环境自检/解决方案）；新建对话框正常 |
| Skill 工坊 | ? PASS | 4 个快捷模板；AI 生成"会议纪要转待办"技能（3 字段+完整提示词->可预览/编辑/一键保存） |
| 任务系统 | ? PASS | /tasks 页面加载，筛选功能正常，历史任务可查看 |
| 设置页 | ? PASS | 邮箱绑定、Agent 在线（ID: 4efb146d）、config 下载、注册/删除功能 |
| 三主题切换 | ? PASS | 默认->典籍->工坊循环切换，data-theme 变化正确，无闪烁 |

### 环境变量配置

| 变量 | 配置位置 |
|------|---------|
| AI_API_KEY | 本地 .env.local + Vercel（web + spellbook-openclaw 项目） |
| AI_BASE_URL = https://api.deepseek.com/v1 | 同上 |
| AI_MODEL = deepseek-chat | 同上 |

### 注意事项
- 添加 Vercel env var 时必须用 --value <val> 参数，避免尾随空白导致 URL 拼接错误
- web 和 spellbook-openclaw 是两个不同的 Vercel 项目，部署和 env var 管理需分开操作

### 待办
- [ ] 删除之前泄露的 DeepSeek API Key（在 DeepSeek 控制台操作）
- [x] 本地 Agent（Python）安装与运行测试
- [x] Skill Workshop 保存技能的端到端测试
- [x] Model Selector 显示文字（当前显示 off 而非 快速模式）

## 2026-06-12 Codex 涓夐」浠诲姟瀹屾垚

### 1. Model Selector 鏄剧ず鏂囧瓧淇
- **闂**锛歋electValue 娓叉煋 value 鍊?"off" 鑰岄潪鏄剧ず鏂囧瓧 "蹇€熸ā寮?
- **淇**锛氬湪 chat/page.tsx 涓负 SelectValue 娣诲姞 placeholder 灞炴€э紝鏍规嵁 	hinkingMode 鍊煎姩鎬佹樉绀轰腑鏂囨爣绛?- **鏂囦欢**锛?pps/web/src/app/(dashboard)/chat/page.tsx

### 2. 鏈湴 Agent (Python) 瀹夎杩愯娴嬭瘯
- **缁撴灉**锛氣渽 鍏ㄩ儴閫氳繃
- **楠岃瘉椤?*锛?  - Python 3.12.2 venv 宸插氨缁紝鎵€鏈変緷璧栧凡瀹夎
  - config.toml 宸查厤缃紙Supabase URL + service_role_key + agent_id: 4efb146d锛?  - openclaw CLI 宸插畨瑁咃紙C:/Users/24366/AppData/Roaming/npm/openclaw.cmd锛?  - Agent 鍚姩鎴愬姛锛氳繛鎺?Supabase 鈫?鏌ヨ Agent "娴嬭瘯" 鈫?鍙戦€佸績璺?鈫?杞浠诲姟闃熷垪
  - 杩愯 10 绉掓棤鎶ラ敊锛屾甯稿湪绾?- **鍚姩鍛戒护**锛?env\Scripts\python src/main.py --config config.toml锛堜粠 apps/local-agent 鐩綍杩愯锛?
### 3. Skill Workshop 淇濆瓨鎶€鑳界鍒扮娴嬭瘯
- **缁撴灉**锛氣渽 鍏ㄩ儴閫氳繃
- **楠岃瘉鏂规硶**锛歂ode REPL + @supabase/supabase-js 鐩存帴娴嬭瘯 API 灞?- **楠岃瘉椤?*锛?  - 鉁?Supabase 杩炴帴姝ｅ父锛坰ervice_role_key锛?  - 鉁?skill INSERT锛堜繚瀛橈級鎴愬姛锛氬垱寤哄畬鏁存妧鑳借褰曪紙鍚嶇О銆佹弿杩般€乫orm_fields銆乸rompt銆乪nabled锛?  - 鉁?skill SELECT锛堟煡璇㈤獙璇侊級鎴愬姛锛氭寜 ID 鍥炶锛屾暟鎹竴鑷?  - 鉁?skill 鍒楄〃鏌ヨ鎴愬姛锛氭寜 user_id 鍒嗛〉
  - 鉁?skill DELETE锛堟竻鐞嗭級鎴愬姛
  - DB 涓凡鏈?5 涓敓浜?Skill锛堝競鍦虹洏鐐瑰姪鎵嬨€佸叕鍙歌儗鏅皟鐮斻€佽惀閿€鏂囨鐢熸垚銆佺幆澧冭嚜妫€鍔╂墜銆佽В鍐虫柟妗堟挵鍐欙級


## 2026-06-12 本地 Agent 全链路测试 + 文件输出验证

### 修复的问题

| 问题 | 根因 | 修复 |
|------|------|------|
| OpenClaw 报错 "Pass --to <E.164>..." | asyncio.create_subprocess_exec 对 Windows .cmd 文件的参数传递有缺陷（长消息含特殊字符时破坏命令行解析） | 改用 subprocess.run + loop.run_in_executor，避免 cmd.exe 参数转义问题 |
| OpenClaw 报错 "Invalid session ID: 公司背景调研" | Session ID 包含中文，OpenClaw 只接受 ASCII | session_id = f"skill-{hashlib.md5(skill_name.encode()).hexdigest()[:16]}" |
| task_runner.py 不传 session_id | 代码没传这个参数给 run_skill() | 在 task_runner.py 中传 session_id=task["id"] |
| Agent 输出只写回 Supabase，不写本地文件 | task_runner 缺少文件输出逻辑 | 添加 output_path 判断：如果 task.input 中有 output_path，将结果也写到该路径 |
| .claude/settings.json JSON 损坏 | 之前修复 API Key 泄露时，权限项的单引号未闭合 + 双引号多层转义 | 重写为有效 JSON |

### 测试结果

| 测试 | 状态 | 详情 |
|------|------|------|
| Test 1: 公司背景调研 + 输出到桌面 | ✅ PASS | OpenClaw 返回 AI 回复；Supabase 状态 completed；桌面文件 华润置地调研报告.md (1530 bytes) |
| Test 2: 解决方案撰写 + 输出到桌面 | ✅ PASS | OpenClaw 返回 AI 回复；Supabase 状态 completed；桌面文件 智慧园区解决方案.md (413 bytes) |

### 端到端流水线验证

`
Web (创建任务)
  → Supabase (status=queued)
    → Local Agent (轮询拉取, status=running)
      → OpenClaw CLI (subprocess.run + --session-id + --message + --json)
        → DeepSeek AI (模型推理 ~50s)
      ← AI 回复 (JSON)
    ← Supabase (status=completed, output=回复内容)
    ← 桌面文件 (output_path 指定的路径)
`

### 待改进
- Skill prompt 设计为交互式（AI 先问问题再给报告），导致首次输出的内容是"请提供更多信息"。后续可在 task_runner 中实现多轮对话或改进 prompt
- Agent 没有开机自启，需手动双击 start_agent.bat
- 没有错误通知机制（任务失败时只写 Supabase，用户网页端看到失败状态但不知原因）

## 2026-06-12 功能优化：一键保存 Skill + 任务记录

### 修改的文件

| 文件 | 改动 |
|------|------|
| pps/web/src/app/api/chat/route.ts | ① 改进了 buildRouterPrompt，让 AI 在检测到可复用任务时**自动输出 ACTION:SAVE_SKILL**，不再等待用户口头确认；② 新增「AI 直执行」任务记录逻辑：当 AI 直接执行非 Skill 匹配的任务时，也会创建 tasks 记录 |

### 改动详情

#### 改进 1：一键保存 Skill
- **之前**：AI 在回复末尾用自然语言写"检测到可沉淀的 Skill"，需要用户回复"保存"后再输出 ACTION:SAVE_SKILL 块
- **之后**：AI 完成任务后**直接输出 ACTION:SAVE_SKILL 块**，前端 SkillDraftCard 组件自动渲染「保存为 Skill」按钮
- 前端按钮已存在（SkillDraftCard + confirmSaveSkill），不需要额外 UI 工作
- 验证通过：任务中心显示「城市在售新盘数据采集 - 2 分钟前 - 完成」

#### 改进 2：Server 端任务写入 tasks 表
- **之前**：只有走 ACTION:SUBMIT 流程的 Skill 匹配任务会写入 tasks 表，AI 直接执行的非匹配任务不留记录
- **之后**：当 isExecutionConfirmation=true 且返回的不是 submit/save_skill 事件时，自动创建一条 tasks 记录（status=completed）
- 验证通过：Skills 管理页显示新的「城市在售新盘数据采集」Skill，排名第一

### 验证截图
- screenshots/opt-05-tasks.png — 任务中心显示「城市在售新盘数据采集 - 完成」
- screenshots/opt-06-skills.png — Skills 列表显示新 Skill（排第一位）
- screenshots/opt-04-done.png — 聊天中 AI 成功匹配 Skill 并执行完成
2026-06-12 ✨ P1 功能优化：Skill 聊天打通 + 多轮文件迭代

### 修改的文件

| 文件 | 改动 |
|------|------|
| `apps/web/src/components/chat/SkillAutocomplete.tsx` | **新建** — 输入 / 唤起自动补全下拉，支持键盘导航（↑↓EnterEsc） |
| `apps/web/src/app/(dashboard)/chat/page.tsx` | 集成 SkillAutocomplete，输入 `/` 触发；select 后填充 Skill 字段模板 |
| `apps/web/src/contexts/ChatContext.tsx` | 新增 `lastOutputPathRef`；请求体增加 `lastOutputPath` + `defaultOutputDir`；reply 事件自动追踪 outputPath |
| `apps/web/src/app/api/chat/route.ts` | Request 支持 `lastOutputPath`/`defaultOutputDir`；Prompt 增加多轮文件迭代上下文；SSE reply 事件附带 `outputPath` |

### 改动详情

#### P1.1 — Skill 工坊 ↔ 聊天打通
- **SkillAutocomplete 组件**：输入 `/` 弹出下拉，实时匹配名称/描述，支持箭头键 + Enter 选择、Esc 关闭
- **选择后自动填充**：将 Skill 的 form_fields 转为模板文本填入输入框，用户补充即可发送
- 数据源：Supabase `skills` 表，`enabled = true` 的 Skill

#### P1.2 — Multi-turn 文件迭代
- **客户端**：ChatContext 追踪 `lastOutputPath` + 读取 localStorage `spellbook_default_output_dir`
- **API 路由**：Prompt 尾部增加「多轮对话 & 文件迭代」区块，告知 AI 上一次输出文件路径
- **ACTION:APPEND_TO_FILE**：AI 可在回复末尾注明 `ACTION:APPEND_TO_FILE <path>`，前端自动识别
- 用户说"加一列"、"补充数据"等，AI 会追加到上次输出的文件

### 部署状态
- 已部署到 Vercel Production：https://web-rho-puce-53.vercel.app
2026-06-12 🏗️ P2 功能优化：Task Center 增强 + Skill 管理增强

### 修改的文件

| 文件 | 改动 |
|------|------|
| `apps/web/src/app/(dashboard)/tasks/page.tsx` | 新增重试失败任务按钮、复制输出按钮、手动刷新链接 |
| `apps/web/src/app/(dashboard)/skills/page.tsx` | 技能卡片可点击展开 Prompt 预览（含复制按钮）、新增「在对话中使用」跳转按钮、展开箭头动画 |

### P2.1 — Task Center 增强
- **重试按钮**：展开失败任务详情后，点击「重试」以相同的 skill_name + input 重新创建队列任务
- **复制输出**：已完成任务的展开详情内一键复制输出内容
- **刷新链接**：标题旁「刷新」按钮，手动 reload 任务列表
- Supabase Realtime 继续保持自动更新（INSERT + UPDATE）

### P2.2 — Skill 管理增强
- **展开 Prompt 预览**：点击技能卡片展开底部面板，可查看完整系统提示词
- **复制 Prompt**：展开面板内一键复制提示词
- **快捷跳转**：新增「在对话中使用」按钮（ExternalLink 图标），直接跳转到聊天页
- **展开箭头**：卡片右侧 ChevronDown 箭头旋转动画指示展开状态

---

## 2026-06-13 🏗️ Windows 一键安装包 (PyInstaller + Inno Setup)

### 修改的文件

| 文件 | 改动 |
|------|------|
| \pps/local-agent/installer_staging/installer.iss\ | **新建** — Inno Setup 安装脚本，含配置向导页面 |
| \pps/local-agent/installer_staging/setup.bat\ | **新建** — 安装后配置助手（Agent ID 输入 + openclaw 检测） |
| \pps/web/public/downloads/SpellBook_Agent_Setup.exe\ | **新建** — 16MB 一键安装包 |
| \pps/web/src/app/(dashboard)/settings/page.tsx\ | 新增「一键安装 Agent」卡片，提供安装包下载链接 |

### 改动详情

#### Windows 一键安装包
- **PyInstaller 打包**：将 Python Agent 打包为单文件 exe（15MB），客户无需安装 Python
- **Inno Setup 安装器**（17MB 安装包）：
  - 安装到 \Program Files\SpellBook Agent\
  - 创建开始菜单快捷方式 + 桌面快捷方式（可选）
  - 选项：注册 Windows 自动启动（计划任务）
  - 选项：安装完成后立即启动 Agent
  - 安装后自动弹出配置助手（setup.bat）
- **配置助手 (setup.bat)**：
  - 检测已存在的 config.toml，有则跳过
  - 手动输入 Agent ID 后自动生成 config.toml
  - 自动检测 openclaw 安装路径（优先 npm 全局目录）
  - 如果未找到 openclaw，提示用户安装

#### 设置页更新
- 新增「一键安装 Agent」卡片
- 下载链接：\/downloads/SpellBook_Agent_Setup.exe\

### 安装包位置
- \E:\Coding\SpellBook_OpenClaw\apps\web\public\downloads\SpellBook_Agent_Setup.exe\
- 在线访问：\https://www.spellb00k.me/downloads/SpellBook_Agent_Setup.exe\

### 客户部署流程（优化后）
1. ✅ 打开网页 → 注册/登录
2. ✅ 设置页 → 注册 Agent → 下载 config.toml
3. ✅ **直接双击安装包**（无需 Python / Node.js 前置安装）
4. ✅ 安装过程输入 Agent ID（或把 config.toml 放进目录）
5. ✅ 安装程序自动检测 openclaw
6. ✅ 勾选"开机自启"→ 安装完 Agent 自动运行

---

## 2026-06-13 🎨 UI 优化 + 主题系统完善

### 修改的文件

| 文件 | 改动 |
|------|------|
| \pps/web/src/hooks/useConfirm.tsx\ | 重写删除确认弹窗：彩色装饰条、圆角图标+ring、卡片布局、入场动画 |
| \pps/web/src/app/(dashboard)/tasks/page.tsx\ | 修复 \????\ 乱码 → \选择\/\取消选择\；多选按钮移至刷新右侧，改名为「多选」 |
| \pps/web/src/components/ui/ThemeToggle.tsx\ | 「默认」主题 →「森林」🌿，图标 Monitor → LeafyGreen |
| \pps/web/src/providers.tsx\ | defaultTheme 改为 studio（工坊为新用户默认） |

### 改动详情

#### 删除弹窗优化 (useConfirm.tsx)
- 顶部彩色装饰条（红色危险 / 黄色警告 / 紫色默认）
- 圆角图标 + ring 装饰圈，视觉统一
- 卡片式布局替代 DialogFooter
- 入场动画 \zoom-in-95\ + \slide-in-from-bottom-4\
- 「不再询问」选项 — 可点击整行切换，存 localStorage
- **弹窗颜色自动适配各主题**：通过 \iolet-*\ CSS 变量映射（森林=绿 / 典籍=紫 / 工坊=陶土红）

#### 任务中心布局调整
- 多选按钮从中间移到左侧（刷新右侧）
- 文字改为「多选/取消多选」

---

## 2026-06-13 🏗️ Windows 一键安装包

### 修改的文件

| 文件 | 改动 |
|------|------|
| \pps/local-agent/installer_staging/installer.iss\ | **新建** — Inno Setup 安装脚本 |
| \pps/local-agent/installer_staging/setup.bat\ | **新建** — 安装后配置助手 |
| \pps/web/public/downloads/SpellBook_Agent_Setup.exe\ | **新建** — 17MB 一键安装包 |
| \pps/web/src/app/(dashboard)/settings/page.tsx\ | 新增「一键安装 Agent」卡片 +「龙虾配置」卡片 |

### 架构

\\\
安装包 (17MB)
├─ spellbook-agent.exe (PyInstaller 单文件, 免 Python)
├─ setup.bat（配置助手）
├─ _run_loop.bat（自动重启循环）
└─ install_autostart.bat（注册开机自启）
\\\

### 安装流程

1. 用户从网页下载安装包 → 双击运行
2. 安装过程中：
   - [后台] 检测 openclaw → 无则自动 \
pm install -g openclaw\
   - 可选：注册 Windows 开机自启（计划任务）
   - 可选：安装后立即启动 Agent
3. 安装完成弹出配置助手：
   - 输入 Agent ID（从网页复制）→ 自动生成 config.toml
   - 交互式菜单配置 openclaw（向导 / 命令行 / 稍后）
4. Agent 自动运行 ✅

### 三种客户场景

| 场景 | 自动化程度 |
|------|-----------|
| 已有 openclaw | ✅ 零操作 |
| 有 Node.js 但无 openclaw | ✅ 自动安装 openclaw |
| 无 Node.js 无 openclaw | ⚠️ 引导安装 Node.js |

---

## 2026-06-13 🌐 OpenClaw 配置（支持自定义 Base URL）

### 修改的文件

| 文件 | 改动 |
|------|------|
| \pps/web/src/app/(dashboard)/settings/page.tsx\ | 新增「龙虾配置」交互卡片：API Key 输入 + Base URL 自定义 + 下载 .env |
| \pps/web/public/downloads/SpellBook_Agent_Setup.exe\ | 更新安装包（setup.bat 支持自定义 Base URL） |
| \pps/local-agent/installer_staging/setup.bat\ | 新增交互菜单：1) openclaw config 向导 2) 直接输入 Key+URL 3) 稍后 |

### 支持任意 OpenAI 兼容 API

| 名称 | Base URL |
|------|---------|
| DeepSeek | \https://api.deepseek.com\ |
| OpenAI | \https://api.openai.com/v1\ |
| 通义千问 | \dashscope.aliyuncs.com/compatible-mode/v1\ |
| 智谱 GLM | \open.bigmodel.cn/api/paas/v4\ |
| 月之暗面 | \pi.moonshot.cn/v1\ |
| 自定义 | 用户输入任意地址 |

---

## 2026-06-13 📖 用户手册重写

### 修改的文件

| 文件 | 改动 |
|------|------|
| \docs/用户使用手册.md\ | 重写前言定位；新增第八章「本地 Agent 安装指南」 |

### 改动详情

- **「SpellBook 是什么」重写**：核心定位改为「龙虾 (OpenClaw) 的网页控制台」，突出对话即控制 + Skill 沉淀
- **第八章（安装指南）**：安装前提、一键安装流程、OpenClaw 配置（含多提供商对照表）、验证方法、常见问题

---

## 2026-06-13 🏭 Skill 工坊 — 导入功能

### 修改的文件

| 文件 | 改动 |
|------|------|
| \pps/web/src/app/api/skill-import/route.ts\ | **新建** — GitHub 导入 API（抓取 SKILL.md / skill.json） |
| \pps/web/src/app/(dashboard)/skills/workshop/page.tsx\ | 新增拖拽导入 + 文件选择 + GitHub URL 导入 + parseSkillFile 函数 |

### 导入方式

**方式一：拖拽 / 选择文件**
- 支持 \SKILL.md\ 和 \.json\ 格式
- 自动解析名称、描述、提示词
- 导入后右侧预览，可直接保存

**方式二：GitHub URL 导入**
- 输入 GitHub 仓库 URL → API 自动抓取 \SKILL.md\ / \skill.json\
- 支持 main / master 分支自动切换
- 解析后进入工坊编辑 → 保存

### API 端点
- \POST /api/skill-import\ — 接收 \{ url: string }\，返回 \{ skill: ParsedSkill }\
- 支持 GitHub 仓库 URL 自动转换 raw 地址
