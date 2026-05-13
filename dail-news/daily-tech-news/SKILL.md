---
name: daily-tech-news
description: Use when user types "daily-tech-news", "每日IT新闻", "科技日报", "tech daily", "今日科技", or asks for a daily tech/IT news digest covering AI, cloud, internet, hardware, software, or robotics. Always trigger this skill when the request involves fetching or summarizing today's technology news across multiple categories, even if phrased casually like "有啥科技新闻" or "tech news today".
---

# 每日科技新闻速递

涵盖 AI、Cloud、互联网、硬件、软件、机器人六大板块。最小化工具调用，生成暗色科技风 HTML 文件并在 footer 显示 token 用量。

## Token 压缩规则（优先遵守）

| 规则 | 说明 |
|------|------|
| 5路并行搜索 | 一次性发起，不分批 |
| 去重 | 同事件多源 → 只留权威源 |
| 仅1次 WebFetch | 只对 #1 Featured 抓全文，其余用 snippet |
| 记录调用次数 | 最后写入 HTML footer |

估算公式：`S×1200 + F×5000 + 3000 = 约用 token`（S=搜索次数，F=抓取次数）

## 第一步：5路并行 WebSearch（同时发起）

```
AI LLM model release robotics automation announcement 2026 past 48 hours
```
```
cloud computing AWS Azure Google Cloud infrastructure news 2026
```
```
Apple Google Meta Microsoft internet platform big tech news 2026
```
```
semiconductor chip GPU CPU hardware device launch 2026
```
```
software developer tools open source startup funding 2026
```

每条保留：**标题、snippet、完整URL、来源域名**

## 第二步：去重 + 分级（不调用额外工具）

同一事件出现在多个搜索结果 → 合并为1条，保留最权威 URL。
分级目标：

- **Featured**（1条）：本期最重磅，做1次 WebFetch 获取完整段落
- **主卡**（**最少12条，目标16条**）：snippet 直接当摘要，译成中文，1–2句
- **快讯**（5–8条）：次要新闻，只需标题 + 来源 + URL

分类标签（每条必须选一个）：
`ai` / `cloud` / `web` / `hardware` / `software` / `robotics`

## 第三步：写入 HTML 文件

⚠️ **CRITICAL — 模板必须完全照抄，不得自行生成 HTML**

禁止自行编写任何 HTML / CSS / JS。流程：

1. 将下方 `## HTML 模板` 代码块的内容 **逐字复制**（包括所有 class 名称、data-cat、data-f、filt() 函数）
2. **只替换**以下占位符（见填写规则速查表）：
   - `{DATE}` `{DATE_FULL}` `{COUNT}` `{SOURCES}` `{S}` `{F}` `{TOKENS}`
   - `CATEGORY` → 实际分类（`ai` / `cloud` / `web` / `hardware` / `software` / `robotics`）
   - `标题占位` `摘要占位` `SOURCE` `SOURCE_NAME` `URL` → 真实内容
3. 用 Write 工具保存到 `~/Documents/temp/daily-tech-news-{YYYY-MM-DD}.html`

完成后输出：**"已生成 → ~/Documents/temp/daily-tech-news-YYYY-MM-DD.html，共 N 条，约用 Z tokens"**

---

## HTML 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>科技日报 · {DATE}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#080808;--s1:#111113;--s2:#1a1a1d;
  --t1:#e8e8ea;--t2:#888890;--t3:#505058;
  --bd:rgba(255,255,255,0.06);
  --ai:#818cf8;--cloud:#34d399;--web:#60a5fa;
  --hw:#fbbf24;--sw:#f472b6;--bot:#c084fc;
  --r:14px;
}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;
  background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased}

/* NAV */
nav{position:sticky;top:0;z-index:100;background:rgba(8,8,8,.85);
  backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid var(--bd);padding:0 24px}
.ni{max-width:1120px;margin:0 auto;height:46px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:"SF Mono",ui-monospace,monospace;font-size:14px;font-weight:600;
  letter-spacing:.5px;color:var(--t1)}
.logo b{color:var(--ai)}
.nd{font-size:11px;color:var(--t3);font-family:"SF Mono",monospace}
.pulse{display:inline-block;width:6px;height:6px;border-radius:50%;
  background:var(--cloud);margin-right:6px;animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

/* HERO */
.hero{max-width:1120px;margin:0 auto;padding:48px 24px 32px}
.ey{font-family:"SF Mono",monospace;font-size:10px;letter-spacing:1.5px;
  text-transform:uppercase;color:var(--t3);margin-bottom:10px}
.hero h1{font-size:clamp(28px,4vw,44px);font-weight:700;letter-spacing:-1.5px;
  line-height:1.1;margin-bottom:12px}
.hero h1 span{
  background:linear-gradient(90deg,var(--ai),var(--cloud),var(--web));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hs{font-size:14px;color:var(--t2);line-height:1.6}

/* FILTERS */
.fbar{max-width:1120px;margin:0 auto 24px;padding:0 24px;display:flex;gap:8px;flex-wrap:wrap}
.fb{padding:5px 12px;border-radius:20px;border:1px solid var(--bd);
  background:transparent;color:var(--t2);font-size:11px;font-weight:600;
  letter-spacing:.3px;cursor:pointer;transition:all .15s;font-family:inherit}
.fb.on,.fb:hover{color:#fff}
.fb[data-f="all"].on{background:var(--t3);border-color:var(--t3)}
.fb[data-f="ai"].on{background:var(--ai);border-color:var(--ai)}
.fb[data-f="cloud"].on{background:var(--cloud);border-color:var(--cloud);color:#000}
.fb[data-f="web"].on{background:var(--web);border-color:var(--web)}
.fb[data-f="hardware"].on{background:var(--hw);border-color:var(--hw);color:#000}
.fb[data-f="software"].on{background:var(--sw);border-color:var(--sw)}
.fb[data-f="robotics"].on{background:var(--bot);border-color:var(--bot)}

/* WRAP */
.wrap{max-width:1120px;margin:0 auto;padding:0 24px 80px}

/* FEATURED */
.feat{display:grid;grid-template-columns:1fr 320px;gap:0;
  background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);
  overflow:hidden;margin-bottom:16px}
.feat-body{padding:28px;border-right:1px solid var(--bd)}
.feat-side{padding:24px;display:flex;flex-direction:column;justify-content:flex-end;gap:12px}
.feat h2{font-size:21px;font-weight:700;letter-spacing:-.4px;line-height:1.3;margin-bottom:10px}
.feat p{font-size:14px;line-height:1.7;color:var(--t2)}

/* GRID */
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:var(--r);
  overflow:hidden;display:flex;flex-direction:column;
  transition:border-color .15s,transform .15s}
.card:hover{border-color:rgba(255,255,255,.15);transform:translateY(-2px)}
.cb{padding:18px 18px 12px;flex:1;border-left:3px solid transparent}
.cb.ai{border-left-color:var(--ai)}
.cb.cloud{border-left-color:var(--cloud)}
.cb.web{border-left-color:var(--web)}
.cb.hardware{border-left-color:var(--hw)}
.cb.software{border-left-color:var(--sw)}
.cb.robotics{border-left-color:var(--bot)}
.card h3{font-size:14px;font-weight:600;letter-spacing:-.2px;line-height:1.4;
  margin-bottom:8px;color:var(--t1)}
.card p{font-size:12px;line-height:1.6;color:var(--t2)}
.cf{padding:10px 18px 14px;display:flex;align-items:center;justify-content:space-between}
.src{font-size:10px;color:var(--t3);font-family:"SF Mono",monospace;font-weight:500}
.rl{font-size:11px;font-weight:600;text-decoration:none;
  display:inline-flex;align-items:center;gap:2px;transition:opacity .15s}
.rl:hover{opacity:.7}
.rl.ai{color:var(--ai)}.rl.cloud{color:var(--cloud)}.rl.web{color:var(--web)}
.rl.hardware{color:var(--hw)}.rl.software{color:var(--sw)}.rl.robotics{color:var(--bot)}

/* TAG badge */
.tag{display:inline-flex;align-items:center;gap:4px;
  font-family:"SF Mono",monospace;font-size:9px;font-weight:700;
  letter-spacing:.8px;text-transform:uppercase;
  padding:3px 8px;border-radius:4px;margin-bottom:12px}
.tag.ai{background:rgba(129,140,248,.15);color:var(--ai)}
.tag.cloud{background:rgba(52,211,153,.15);color:var(--cloud)}
.tag.web{background:rgba(96,165,250,.15);color:var(--web)}
.tag.hardware{background:rgba(251,191,36,.15);color:var(--hw)}
.tag.software{background:rgba(244,114,182,.15);color:var(--sw)}
.tag.robotics{background:rgba(192,132,252,.15);color:var(--bot)}

/* QUICK BYTES */
.sl{font-family:"SF Mono",monospace;font-size:9px;font-weight:700;
  letter-spacing:1.5px;text-transform:uppercase;color:var(--t3);
  padding-bottom:10px;border-bottom:1px solid var(--bd);margin-bottom:12px}
.ql{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.qi{background:var(--s1);border:1px solid var(--bd);border-radius:10px;
  padding:12px 14px;display:flex;align-items:center;justify-content:space-between;
  transition:border-color .15s}
.qi:hover{border-color:rgba(255,255,255,.15)}
.qtag{font-family:"SF Mono",monospace;font-size:8px;font-weight:700;
  letter-spacing:.5px;text-transform:uppercase;margin-bottom:3px}
.qtitle{font-size:12px;font-weight:500;color:var(--t1);line-height:1.35}
.qsrc{font-size:10px;color:var(--t3);margin-top:2px}
.qa{text-decoration:none;font-size:14px;padding-left:10px;flex-shrink:0}

/* FOOTER */
footer{border-top:1px solid var(--bd);padding:20px 24px;
  font-family:"SF Mono",monospace;font-size:10px;color:var(--t3);
  line-height:1.8;text-align:center}
.tok{color:var(--t2);margin-top:4px}

[data-h]{display:none!important}

@media(max-width:800px){
  .feat{grid-template-columns:1fr}.feat-side{border-top:1px solid var(--bd)}
  .grid{grid-template-columns:1fr}.ql{grid-template-columns:1fr}
}
</style>
</head>
<body>
<nav>
  <div class="ni">
    <span class="logo"><b>//</b> TECH DAILY</span>
    <span class="nd"><span class="pulse"></span>{DATE_FULL}</span>
  </div>
</nav>

<div class="hero">
  <div class="ey">// daily briefing · {DATE}</div>
  <h1>今日<span>科技速递</span></h1>
  <p class="hs">精选 {COUNT} 条独立事件 · {SOURCES}</p>
</div>

<div class="fbar">
  <button class="fb on" data-f="all" onclick="filt(this,'all')">全部 {COUNT}</button>
  <button class="fb" data-f="ai" onclick="filt(this,'ai')">🤖 AI</button>
  <button class="fb" data-f="cloud" onclick="filt(this,'cloud')">☁️ Cloud</button>
  <button class="fb" data-f="web" onclick="filt(this,'web')">🌐 互联网</button>
  <button class="fb" data-f="hardware" onclick="filt(this,'hardware')">💻 硬件</button>
  <button class="fb" data-f="software" onclick="filt(this,'software')">📦 软件</button>
  <button class="fb" data-f="robotics" onclick="filt(this,'robotics')">🦾 机器人</button>
</div>

<div class="wrap">

  <!-- FEATURED（1条，WebFetch 全文） data-cat="ai|cloud|web|hardware|software|robotics" -->
  <div class="feat" data-cat="CATEGORY">
    <div class="feat-body">
      <span class="tag CATEGORY">🤖 AI</span>
      <h2>Featured 标题占位</h2>
      <p>摘要占位（来自 WebFetch，2–3句中文）。</p>
    </div>
    <div class="feat-side">
      <span class="src">SOURCE_NAME</span>
      <a class="rl CATEGORY" href="URL" target="_blank" rel="noopener">阅读原文 ↗</a>
    </div>
  </div>

  <!-- GRID（12–16张卡，用 snippet）-->
  <div class="grid">
    <!-- 每张卡：复制此结构，CATEGORY 替换为实际分类 -->
    <article class="card" data-cat="CATEGORY">
      <div class="cb CATEGORY">
        <span class="tag CATEGORY">🌐 互联网</span>
        <h3>标题占位</h3>
        <p>摘要占位（snippet，1–2句）。</p>
      </div>
      <div class="cf">
        <span class="src">SOURCE</span>
        <a class="rl CATEGORY" href="URL" target="_blank" rel="noopener">↗</a>
      </div>
    </article>
    <!-- 继续添加更多卡片 -->
  </div>

  <!-- QUICK BYTES（5–8条快讯）-->
  <div class="sl">// QUICK BYTES</div>
  <div class="ql">
    <!-- 每条：复制此结构 -->
    <div class="qi" data-cat="CATEGORY">
      <div>
        <div class="qtag" style="color:var(--ai)">AI</div>
        <div class="qtitle">快讯标题占位</div>
        <div class="qsrc">SOURCE · 时间</div>
      </div>
      <a class="qa" style="color:var(--ai)" href="URL" target="_blank" rel="noopener">↗</a>
    </div>
    <!-- 继续 -->
  </div>

</div>

<footer>
  TECH DAILY · {DATE_FULL} · 内容来源公开网络，仅供参考<br>
  <span class="tok">// 本次消耗：{S} 次搜索 · {F} 次抓取 · 约 {TOKENS} tokens</span>
</footer>

<script>
function filt(btn,cat){
  document.querySelectorAll('.fb').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('[data-cat]').forEach(el=>{
    cat==='all'||el.dataset.cat===cat
      ?el.removeAttribute('data-h')
      :el.setAttribute('data-h','');
  });
}
</script>
</body>
</html>
```

---

## 填写规则速查

| 占位符 | 填写内容 |
|--------|---------|
| `{DATE}` | `2026-05-05` |
| `{DATE_FULL}` | `2026年5月5日` |
| `{COUNT}` | 实际总条数 |
| `{SOURCES}` | 主要来源，如 `OpenAI · AWS · TechCrunch` |
| `CATEGORY` | `ai` / `cloud` / `web` / `hardware` / `software` / `robotics` |
| `{S}` | WebSearch 调用次数 |
| `{F}` | WebFetch 调用次数 |
| `{TOKENS}` | S×1200 + F×5000 + 3000 |
| `href` | **真实 URL，不得伪造** |

**摘要语言**：简体中文。英文专有名词保留原文（如 GPT-5、Kubernetes）。
