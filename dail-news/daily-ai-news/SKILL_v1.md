---
name: daily-ai-news
description: Use when user types "daily-ai-news", "近日ai新闻", "每日AI新闻", or asks for a daily AI news digest - fetches 15-20 AI news items from multiple sources and outputs a self-contained Apple dark-mode HTML file with clickable links
---

# AI每日行文速递

## Token 压缩策略（先读）

**核心原则：搜索片段即摘要，最小化 WebFetch 次数。**

- 4 条并行 WebSearch → 获取 30-40 候选（含搜索摘要片段）
- **去重**：同一事件多个来源 → 只保留权威源（官方博客 > 媒体）
- **只对排名第 1 的 featured 故事做 1 次 WebFetch**，其余全用搜索片段当摘要
- 目标：15–20 条独立事件，共用 ≤5 次工具调用

## 第一步：并行 WebSearch（4 路同时发起）

```
AI news last 48 hours site:openai.com OR site:anthropic.com OR site:deepmind.google OR site:huggingface.co OR site:mistral.ai OR site:x.ai
```
```
AI model release OR LLM benchmark OR AI agent announcement 2025 site:techcrunch.com OR site:theverge.com OR site:venturebeat.com
```
```
artificial intelligence research paper OR AI startup funding OR AI regulation 2025
```
```
人工智能 大模型 发布 2025 site:36kr.com OR site:jiqizhixin.com OR site:leiphone.com OR site:caixin.com
```

保留每条结果的：**标题、摘要片段、URL、来源域名、发布时间**

## 第二步：去重 + 分级

**去重规则**：标题含相同实体且描述同一事件 → 合并为 1 条，保留权威源 URL

**分级**：
- **Featured**（1条）：最重大，只此 1 条做 WebFetch 获取完整内容
- **主卡**（10–14条）：用搜索片段直接当摘要，无需 Fetch
- **快讯**（4–6条）：次要信息，只需标题 + 来源 + URL

分类标签：`model`（模型/研究）/ `product`（产品/应用）/ `industry`（行业/监管）/ `cn`（国内）

## 第三步：生成 HTML

将数据填入模板，**用 Write 工具保存为** `~/Documents/daily-ai-news-{YYYY-MM-DD}.html`

---

## HTML 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI 速递 · {DATE}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#000;--s1:#1c1c1e;--s2:#2c2c2e;--s3:#3a3a3c;
  --t1:#f5f5f7;--t2:#98989d;--t3:#636366;
  --acc:#0a84ff;--acc2:#30d158;--acc3:#ff9f0a;--acc4:#bf5af2;
  --border:rgba(255,255,255,0.08);
  --r:16px;--r2:12px;
}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",sans-serif;
  background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased}

/* grain overlay */
body::before{content:'';position:fixed;inset:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events:none;z-index:0;opacity:.4}

/* nav */
nav{position:sticky;top:0;z-index:100;
  background:rgba(0,0,0,.75);
  backdrop-filter:saturate(180%) blur(24px);
  -webkit-backdrop-filter:saturate(180%) blur(24px);
  border-bottom:1px solid var(--border);padding:0 24px}
.nav-inner{max-width:1100px;margin:0 auto;height:48px;
  display:flex;align-items:center;justify-content:space-between}
.logo{font-size:15px;font-weight:600;letter-spacing:-.3px;color:var(--t1)}
.logo span{color:var(--acc)}
.nav-date{font-size:12px;color:var(--t3)}

/* hero */
.hero{max-width:1100px;margin:0 auto;padding:52px 24px 36px;position:relative;z-index:1}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;
  color:var(--acc);margin-bottom:12px}
.hero h1{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;
  font-size:clamp(36px,5vw,52px);font-weight:700;letter-spacing:-2px;
  line-height:1.05;color:var(--t1);margin-bottom:14px}
.hero h1 em{font-style:normal;
  background:linear-gradient(135deg,#0a84ff,#30d158);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:15px;color:var(--t2);line-height:1.6}

/* filter */
.filters{max-width:1100px;margin:0 auto 28px;padding:0 24px;
  display:flex;gap:8px;flex-wrap:wrap;position:relative;z-index:1}
.fbtn{padding:6px 14px;border-radius:20px;border:1px solid var(--border);
  background:rgba(255,255,255,.04);color:var(--t2);
  font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;font-family:inherit}
.fbtn:hover,.fbtn.on{background:var(--acc);color:#fff;border-color:var(--acc)}

/* layout */
.wrap{max-width:1100px;margin:0 auto;padding:0 24px 80px;position:relative;z-index:1}

/* featured row: big + secondary */
.row-featured{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:16px}

/* card base */
.card{background:var(--s1);border:1px solid var(--border);border-radius:var(--r);
  overflow:hidden;transition:transform .2s,box-shadow .2s,border-color .2s;
  display:flex;flex-direction:column;cursor:pointer}
.card:hover{transform:translateY(-3px);
  box-shadow:0 12px 40px rgba(0,0,0,.6);border-color:rgba(255,255,255,.15)}

.cbody{padding:22px 22px 14px;flex:1}
.tag{display:inline-flex;align-items:center;gap:4px;
  padding:3px 9px;border-radius:6px;font-size:10px;font-weight:700;
  letter-spacing:.4px;text-transform:uppercase;margin-bottom:14px}
.tm{background:rgba(10,132,255,.15);color:#4db6ff}
.tp{background:rgba(48,209,88,.15);color:#30d158}
.ti{background:rgba(255,159,10,.15);color:#ff9f0a}
.tc{background:rgba(191,90,242,.15);color:#bf5af2}

.card h2{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;
  font-size:17px;font-weight:600;letter-spacing:-.3px;line-height:1.35;
  color:var(--t1);margin-bottom:10px}
.card p{font-size:13px;line-height:1.65;color:var(--t2)}

.cfoot{padding:14px 22px 18px;display:flex;align-items:center;
  justify-content:space-between;border-top:1px solid var(--border);margin-top:auto}
.src{font-size:11px;color:var(--t3);font-weight:500}
.rlink{font-size:12px;font-weight:500;color:var(--acc);text-decoration:none;
  display:inline-flex;align-items:center;gap:3px;transition:opacity .15s}
.rlink:hover{opacity:.7}
.rlink svg{width:11px;height:11px}

/* featured card overrides */
.card.feat{flex-direction:row}
.card.feat .cbody{padding:28px}
.card.feat h2{font-size:22px;letter-spacing:-.5px}
.card.feat p{font-size:14px}
.card.feat .cfoot{flex-direction:column;align-items:flex-start;
  border-top:none;border-left:1px solid var(--border);
  min-width:160px;justify-content:flex-end;gap:10px;padding:28px}

/* main grid */
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px}

/* quick bytes */
.section-label{font-size:11px;font-weight:600;letter-spacing:.8px;
  text-transform:uppercase;color:var(--t3);margin-bottom:14px;
  padding-bottom:10px;border-bottom:1px solid var(--border)}
.quick-list{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.qitem{background:var(--s1);border:1px solid var(--border);border-radius:var(--r2);
  padding:14px 16px;display:flex;align-items:center;justify-content:space-between;
  transition:border-color .15s}
.qitem:hover{border-color:rgba(255,255,255,.2)}
.qtag{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
  margin-bottom:4px}
.qtitle{font-size:13px;font-weight:500;color:var(--t1);line-height:1.35;margin-bottom:2px}
.qsrc{font-size:11px;color:var(--t3)}
.qarrow{color:var(--acc);text-decoration:none;font-size:16px;padding-left:12px;flex-shrink:0}

/* footer */
footer{border-top:1px solid var(--border);padding:28px 24px;
  text-align:center;color:var(--t3);font-size:11px;line-height:1.8;
  position:relative;z-index:1}

/* hide for filter */
[data-h]{display:none!important}

@media(max-width:768px){
  .row-featured,.grid{grid-template-columns:1fr}
  .card.feat{flex-direction:column}
  .card.feat .cfoot{border-left:none;border-top:1px solid var(--border);flex-direction:row}
  .quick-list{grid-template-columns:1fr}
}
</style>
</head>
<body>

<nav>
  <div class="nav-inner">
    <span class="logo">AI<span> 行文速递</span></span>
    <span class="nav-date">{DATE_FULL}</span>
  </div>
</nav>

<div class="hero">
  <div class="eyebrow">Daily Briefing</div>
  <h1>近日 <em>AI</em> 速递</h1>
  <p class="hero-sub">精选 {COUNT} 条 · 去重后独立事件 · 来自 {SOURCES}</p>
</div>

<div class="filters">
  <button class="fbtn on" onclick="filt(event,'all')">全部 {COUNT}</button>
  <button class="fbtn" onclick="filt(event,'model')">🔬 模型与研究</button>
  <button class="fbtn" onclick="filt(event,'product')">⚡ 产品与应用</button>
  <button class="fbtn" onclick="filt(event,'industry')">🏢 行业动态</button>
  <button class="fbtn" onclick="filt(event,'cn')">🇨🇳 国内</button>
</div>

<div class="wrap">

  <!-- ① Featured + Secondary -->
  <div class="row-featured">

    <!-- FEATURED（最重要，WebFetch 过的）-->
    <article class="card feat" data-cat="model">
      <div class="cbody">
        <span class="tag tm">🔬 模型与研究</span>
        <h2>标题占位</h2>
        <p>摘要占位（来自 WebFetch 的完整内容，2–3句）</p>
      </div>
      <div class="cfoot">
        <span class="src">OpenAI Blog</span>
        <a class="rlink" href="URL" target="_blank" rel="noopener">
          阅读原文
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10L10 2M4 2h6v6"/></svg>
        </a>
      </div>
    </article>

    <!-- Secondary -->
    <article class="card" data-cat="product">
      <div class="cbody">
        <span class="tag tp">⚡ 产品与应用</span>
        <h2>标题占位</h2>
        <p>摘要占位</p>
      </div>
      <div class="cfoot">
        <span class="src">来源</span>
        <a class="rlink" href="URL" target="_blank" rel="noopener">阅读原文
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10L10 2M4 2h6v6"/></svg>
        </a>
      </div>
    </article>

  </div>

  <!-- ② Main grid（10–14张普通卡） -->
  <div class="grid">

    <!-- 每张卡复制此结构，data-cat="model|product|industry|cn" -->
    <article class="card" data-cat="industry">
      <div class="cbody">
        <span class="tag ti">🏢 行业动态</span>
        <h2>标题占位</h2>
        <p>摘要占位（搜索片段，1–2句）</p>
      </div>
      <div class="cfoot">
        <span class="src">来源</span>
        <a class="rlink" href="URL" target="_blank" rel="noopener">阅读原文
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 10L10 2M4 2h6v6"/></svg>
        </a>
      </div>
    </article>

    <!-- ...更多卡片... -->

  </div>

  <!-- ③ Quick Bytes（4–6条次要快讯） -->
  <div class="section-label">快讯 Quick Bytes</div>
  <div class="quick-list">

    <!-- 每条快讯复制此结构 -->
    <div class="qitem" data-cat="model">
      <div>
        <div class="qtag tm">🔬 研究</div>
        <div class="qtitle">标题占位</div>
        <div class="qsrc">来源 · 时间</div>
      </div>
      <a class="qarrow" href="URL" target="_blank" rel="noopener">↗</a>
    </div>

  </div>

</div>

<footer>
  AI 行文速递 · {DATE_FULL} · 内容来源公开网络，仅供参考 · 由 Claude 自动整理
</footer>

<script>
function filt(e,cat){
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('on'));
  e.target.classList.add('on');
  document.querySelectorAll('[data-cat]').forEach(el=>{
    cat==='all'||el.dataset.cat===cat ? el.removeAttribute('data-h') : el.setAttribute('data-h','');
  });
}
</script>
</body>
</html>
```

---

## 填写规则

| 占位符 | 内容 |
|--------|------|
| `{DATE}` | `2025-05-04` |
| `{DATE_FULL}` | `2025年5月4日` |
| `{COUNT}` | 实际总条数 |
| `{SOURCES}` | 去重后的来源列表，如 `OpenAI · Anthropic · TechCrunch` |
| `data-cat` | `model` / `product` / `industry` / `cn` |
| `tag` class | `tm`=模型 `tp`=产品 `ti`=行业 `tc`=国内 |
| `href` | **真实抓取到的原始 URL，不得伪造** |

**主卡摘要**：直接用搜索返回的 snippet，加必要的中文翻译，保持 1–2 句  
**featured 摘要**：用 WebFetch 获取的完整段落，2–3 句  
**快讯**：只需标题 + 来源，无摘要

## 输出

```
~/Documents/daily-ai-news-{YYYY-MM-DD}.html
```
完成后告知：**"已生成 → ~/Documents/daily-ai-news-YYYY-MM-DD.html，浏览器打开即可。共 N 条，去重后独立事件。"**
