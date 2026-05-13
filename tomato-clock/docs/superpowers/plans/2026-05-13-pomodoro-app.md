# Pomodoro Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a macOS desktop Pomodoro timer with Electron, featuring a modern gradient UI, system notifications, and a tray icon.

**Architecture:** Electron double-process — `main.js` owns the native layer (window, tray, notifications), `renderer.js` drives the DOM, and `timer.js` contains pure state-machine logic testable without Electron. `preload.js` bridges them via `contextBridge`.

**Tech Stack:** Electron 28, Vanilla JS, Jest (unit tests), electron-builder (packaging)

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `main.js`
- Create: `preload.js`
- Create: `index.html`
- Create: `styles.css`
- Create: `renderer.js`
- Create: `timer.js`

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/jun/Documents/Github/superdog_poc/tomato-clock
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install --save-dev electron@^28 jest@^29
```

- [ ] **Step 3: Update package.json with correct main and scripts**

Replace the generated `package.json` with:

```json
{
  "name": "tomato-clock",
  "version": "1.0.0",
  "description": "Pomodoro desktop timer",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "test": "jest"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "jest": "^29.0.0"
  }
}
```

- [ ] **Step 4: Create minimal main.js**

```js
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 360,
    height: 480,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 5: Create placeholder preload.js**

```js
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('api', {
  notify: (title, body) => {},
  setTray: (text) => {},
})
```

- [ ] **Step 6: Create placeholder index.html**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'" />
  <title>Tomato Clock</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div id="app">
    <div class="mode-tabs">
      <button class="tab active" data-mode="focus">专注</button>
      <button class="tab" data-mode="short">短休息</button>
      <button class="tab" data-mode="long">长休息</button>
    </div>

    <div class="ring-container">
      <svg class="ring" viewBox="0 0 200 200">
        <circle class="ring-bg" cx="100" cy="100" r="88"/>
        <circle class="ring-progress" id="ringProgress" cx="100" cy="100" r="88"/>
      </svg>
      <div class="ring-text">
        <div id="timerDisplay">25:00</div>
        <div id="modeLabel">FOCUS</div>
      </div>
    </div>

    <div class="controls">
      <button id="btnReset" class="ctrl-btn secondary">⟳</button>
      <button id="btnStartPause" class="ctrl-btn primary">▶</button>
      <button id="btnSkip" class="ctrl-btn secondary">⏭</button>
    </div>

    <div class="progress-dots" id="progressDots"></div>
    <div class="progress-label" id="progressLabel">第 1 / 4 个番茄 · 今日 0 个</div>
  </div>
  <script src="timer.js"></script>
  <script src="renderer.js"></script>
</body>
</html>
```

- [ ] **Step 7: Create placeholder files**

Create empty `styles.css`, `renderer.js`, `timer.js`.

```bash
touch styles.css renderer.js timer.js
```

- [ ] **Step 8: Verify app launches**

```bash
npm start
```

Expected: blank window 360×480 opens, no console errors.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json main.js preload.js index.html styles.css renderer.js timer.js
git commit -m "feat: scaffold Electron app"
```

---

### Task 2: Timer state machine (pure logic, TDD)

**Files:**
- Create: `timer.js`
- Create: `tests/timer.test.js`

- [ ] **Step 1: Create tests directory and write failing tests**

```bash
mkdir -p tests
```

Create `tests/timer.test.js`:

```js
const { createTimer, MODES } = require('../timer')

describe('createTimer', () => {
  test('initial state is focus mode, not running', () => {
    const t = createTimer()
    expect(t.mode).toBe(MODES.FOCUS)
    expect(t.running).toBe(false)
    expect(t.remaining).toBe(25 * 60)
    expect(t.pomodoroCount).toBe(0)
    expect(t.todayCount).toBe(0)
  })

  test('tick does nothing when not running', () => {
    const t = createTimer()
    const before = t.remaining
    t.tick(Date.now())
    expect(t.remaining).toBe(before)
  })

  test('start sets running true and records startTime', () => {
    const t = createTimer()
    const now = Date.now()
    t.start(now)
    expect(t.running).toBe(true)
    expect(t.startTime).toBe(now)
  })

  test('tick reduces remaining based on elapsed time', () => {
    const t = createTimer()
    const now = Date.now()
    t.start(now)
    t.tick(now + 5000)
    expect(t.remaining).toBe(25 * 60 - 5)
  })

  test('pause stops running and saves remaining', () => {
    const t = createTimer()
    const now = Date.now()
    t.start(now)
    t.tick(now + 10000)
    t.pause()
    expect(t.running).toBe(false)
    expect(t.remaining).toBe(25 * 60 - 10)
  })

  test('reset returns to start of current mode', () => {
    const t = createTimer()
    t.start(Date.now())
    t.reset()
    expect(t.running).toBe(false)
    expect(t.remaining).toBe(25 * 60)
  })

  test('advance after focus goes to short break', () => {
    const t = createTimer()
    const result = t.advance()
    expect(result.mode).toBe(MODES.SHORT_BREAK)
    expect(result.remaining).toBe(5 * 60)
    expect(result.pomodoroCount).toBe(1)
    expect(result.todayCount).toBe(1)
  })

  test('advance after 4th focus goes to long break', () => {
    const t = createTimer()
    t.pomodoroCount = 3
    const result = t.advance()
    expect(result.mode).toBe(MODES.LONG_BREAK)
    expect(result.remaining).toBe(15 * 60)
  })

  test('advance after short break goes to focus', () => {
    const t = createTimer()
    t.mode = MODES.SHORT_BREAK
    t.remaining = 0
    const result = t.advance()
    expect(result.mode).toBe(MODES.FOCUS)
    expect(result.remaining).toBe(25 * 60)
    expect(result.pomodoroCount).toBe(0)
  })

  test('advance after long break resets pomodoroCount and goes to focus', () => {
    const t = createTimer()
    t.mode = MODES.LONG_BREAK
    t.remaining = 0
    const result = t.advance()
    expect(result.mode).toBe(MODES.FOCUS)
    expect(result.pomodoroCount).toBe(0)
  })

  test('tick triggers advance when remaining hits 0', () => {
    const t = createTimer()
    const now = Date.now()
    t.start(now)
    t.tick(now + 25 * 60 * 1000 + 500)
    expect(t.mode).toBe(MODES.SHORT_BREAK)
    expect(t.running).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they all fail**

```bash
npm test
```

Expected: all tests FAIL with "Cannot find module '../timer'"

- [ ] **Step 3: Implement timer.js**

```js
const MODES = {
  FOCUS: 'focus',
  SHORT_BREAK: 'short',
  LONG_BREAK: 'long',
}

const DURATIONS = {
  [MODES.FOCUS]: 25 * 60,
  [MODES.SHORT_BREAK]: 5 * 60,
  [MODES.LONG_BREAK]: 15 * 60,
}

function createTimer(savedTodayCount = 0) {
  const state = {
    mode: MODES.FOCUS,
    running: false,
    remaining: DURATIONS[MODES.FOCUS],
    pomodoroCount: 0,
    todayCount: savedTodayCount,
    startTime: null,
    segmentStart: DURATIONS[MODES.FOCUS],
  }

  state.start = function (now) {
    state.startTime = now
    state.running = true
  }

  state.pause = function () {
    state.running = false
    state.startTime = null
  }

  state.reset = function () {
    state.running = false
    state.startTime = null
    state.remaining = DURATIONS[state.mode]
    state.segmentStart = state.remaining
  }

  state.advance = function () {
    if (state.mode === MODES.FOCUS) {
      state.pomodoroCount += 1
      state.todayCount += 1
      if (state.pomodoroCount % 4 === 0) {
        state.mode = MODES.LONG_BREAK
      } else {
        state.mode = MODES.SHORT_BREAK
      }
    } else {
      if (state.mode === MODES.LONG_BREAK) {
        state.pomodoroCount = 0
      }
      state.mode = MODES.FOCUS
    }
    state.remaining = DURATIONS[state.mode]
    state.segmentStart = state.remaining
    state.startTime = null
    return state
  }

  state.tick = function (now) {
    if (!state.running) return
    const elapsed = Math.floor((now - state.startTime) / 1000)
    const next = state.segmentStart - elapsed
    if (next <= 0) {
      state.advance()
      state.running = true
      state.startTime = now
    } else {
      state.remaining = next
    }
  }

  return state
}

if (typeof module !== 'undefined') {
  module.exports = { createTimer, MODES, DURATIONS }
} else {
  window.TimerModule = { createTimer, MODES, DURATIONS }
}
```

- [ ] **Step 4: Run tests to verify they all pass**

```bash
npm test
```

Expected: all 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add timer.js tests/timer.test.js
git commit -m "feat: timer state machine with tests"
```

---

### Task 3: Styles — gradient UI theme

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Write styles.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-user-select: none;
  user-select: none;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100vh;
  overflow: hidden;
  color: #fff;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 24px;
  height: 100%;
}

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
}

.tab {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-weight: 600;
}

.tab:hover:not(.active) {
  background: rgba(255, 255, 255, 0.15);
}

/* Progress ring */
.ring-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin-bottom: 28px;
}

.ring {
  transform: rotate(-90deg);
  width: 200px;
  height: 200px;
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.15);
  stroke-width: 8;
}

.ring-progress {
  fill: none;
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 553;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 0.5s ease;
}

.ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

#timerDisplay {
  font-size: 52px;
  font-weight: 100;
  letter-spacing: 2px;
  line-height: 1;
}

#modeLabel {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 6px;
  letter-spacing: 3px;
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.ctrl-btn {
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s, opacity 0.2s;
}

.ctrl-btn:active {
  transform: scale(0.92);
}

.ctrl-btn.secondary {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 18px;
}

.ctrl-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.25);
}

.ctrl-btn.primary {
  background: rgba(255, 255, 255, 0.95);
  color: #764ba2;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  font-size: 22px;
  font-weight: bold;
}

.ctrl-btn.primary:hover {
  background: #fff;
}

/* Progress dots */
.progress-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transition: background 0.3s;
}

.dot.done {
  background: rgba(255, 255, 255, 0.9);
}

.progress-label {
  font-size: 12px;
  opacity: 0.6;
}
```

- [ ] **Step 2: Verify visually**

```bash
npm start
```

Expected: gradient window with styled HTML elements (tabs, ring outline, buttons, dots).

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "feat: gradient UI styles"
```

---

### Task 4: Renderer — connect timer to UI

**Files:**
- Modify: `renderer.js`

- [ ] **Step 1: Write renderer.js**

```js
const { createTimer, MODES, DURATIONS } = window.TimerModule

const CIRCUMFERENCE = 2 * Math.PI * 88 // ~553

const savedToday = parseInt(localStorage.getItem('todayCount') || '0', 10)
const timer = createTimer(savedToday)

const els = {
  display: document.getElementById('timerDisplay'),
  label: document.getElementById('modeLabel'),
  ring: document.getElementById('ringProgress'),
  startPause: document.getElementById('btnStartPause'),
  reset: document.getElementById('btnReset'),
  skip: document.getElementById('btnSkip'),
  dots: document.getElementById('progressDots'),
  progressLabel: document.getElementById('progressLabel'),
  tabs: document.querySelectorAll('.tab'),
}

function fmt(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function updateRing(remaining, total) {
  const offset = CIRCUMFERENCE * (remaining / total)
  els.ring.style.strokeDashoffset = CIRCUMFERENCE - offset
}

function updateDots() {
  els.dots.innerHTML = ''
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('div')
    dot.className = 'dot' + (i < timer.pomodoroCount % 4 ? ' done' : '')
    els.dots.appendChild(dot)
  }
}

function updateTabs() {
  els.tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.mode === timer.mode)
  })
}

const MODE_LABELS = {
  [MODES.FOCUS]: 'FOCUS',
  [MODES.SHORT_BREAK]: 'BREAK',
  [MODES.LONG_BREAK]: 'LONG BREAK',
}

function render() {
  const total = DURATIONS[timer.mode]
  els.display.textContent = fmt(timer.remaining)
  els.label.textContent = MODE_LABELS[timer.mode]
  els.startPause.textContent = timer.running ? '⏸' : '▶'
  updateRing(timer.remaining, total)
  updateDots()
  updateTabs()
  els.progressLabel.textContent =
    `第 ${(timer.pomodoroCount % 4) + 1} / 4 个番茄 · 今日 ${timer.todayCount} 个`
  localStorage.setItem('todayCount', timer.todayCount)

  if (window.api) {
    const trayText = timer.running
      ? fmt(timer.remaining)
      : `⏸ ${fmt(timer.remaining)}`
    window.api.setTray(trayText)
  }
}

let intervalId = null

function startTick() {
  if (intervalId) return
  intervalId = setInterval(() => {
    timer.tick(Date.now())
    render()
    if (timer.mode !== lastMode) {
      lastMode = timer.mode
      fireNotification()
    }
  }, 1000)
}

function stopTick() {
  clearInterval(intervalId)
  intervalId = null
}

let lastMode = timer.mode

function fireNotification() {
  if (!window.api) return
  if (timer.mode === MODES.SHORT_BREAK) {
    window.api.notify('休息一下 🎉', `完成第 ${timer.pomodoroCount} 个番茄，休息 5 分钟`)
  } else if (timer.mode === MODES.LONG_BREAK) {
    window.api.notify('休息一下 🎉', `完成第 ${timer.pomodoroCount} 个番茄，长休息 15 分钟`)
  } else if (timer.mode === MODES.FOCUS) {
    window.api.notify('专注时间到 🍅', `开始第 ${(timer.pomodoroCount % 4) + 1} 个番茄`)
  }
}

els.startPause.addEventListener('click', () => {
  if (timer.running) {
    timer.pause()
    stopTick()
  } else {
    timer.start(Date.now())
    startTick()
  }
  render()
})

els.reset.addEventListener('click', () => {
  timer.pause()
  stopTick()
  timer.reset()
  render()
})

els.skip.addEventListener('click', () => {
  const wasRunning = timer.running
  timer.pause()
  stopTick()
  timer.advance()
  lastMode = timer.mode
  if (wasRunning) {
    timer.start(Date.now())
    startTick()
  }
  render()
})

els.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (timer.running) return
    timer.mode = tab.dataset.mode
    timer.reset()
    lastMode = timer.mode
    render()
  })
})

render()
```

- [ ] **Step 2: Verify timer works visually**

```bash
npm start
```

Expected: click ▶ to start — time counts down, ring shrinks, tray label would update (no tray yet). Click ⏸ to pause, ⟳ to reset, ⏭ to skip.

- [ ] **Step 3: Commit**

```bash
git add renderer.js
git commit -m "feat: renderer connects timer to UI"
```

---

### Task 5: IPC bridge — notifications and tray

**Files:**
- Modify: `preload.js`
- Modify: `main.js`

- [ ] **Step 1: Update preload.js with real IPC calls**

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  setTray: (text) => ipcRenderer.send('set-tray', text),
})
```

- [ ] **Step 2: Update main.js — add tray, notifications, single-instance lock, hide-on-close**

```js
const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, nativeImage } = require('electron')
const path = require('path')

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win = null
let tray = null

function createWindow() {
  win = new BrowserWindow({
    width: 360,
    height: 480,
    resizable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })
  win.loadFile('index.html')

  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
  })
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setTitle('🍅')
  tray.setToolTip('Tomato Clock')

  const menu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => { win.show(); win.focus() } },
    { type: 'separator' },
    { label: '退出', click: () => { app.exit(0) } },
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => { win.show(); win.focus() })
}

ipcMain.on('notify', (_e, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
})

ipcMain.on('set-tray', (_e, text) => {
  if (tray) tray.setTitle(text)
})

app.on('second-instance', () => {
  if (win) { win.show(); win.focus() }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})

app.on('activate', () => {
  if (win) { win.show(); win.focus() }
})
```

- [ ] **Step 3: Create placeholder tray icons**

```bash
mkdir -p assets
```

Create a 16×16 PNG for the tray icon. As a quick placeholder, copy any small PNG:

```bash
# Create a minimal 1x1 red PNG as placeholder (replace with real icon later)
python3 -c "
import struct, zlib
def png(w,h,data):
    def chunk(t,d):
        c=struct.pack('>I',len(d))+t+d
        return c+struct.pack('>I',zlib.crc32(c[4:])&0xffffffff)
    raw=b''.join(b'\x00'+bytes([255,80,80]*w) for _ in range(h))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
open('assets/tray-icon.png','wb').write(png(16,16,None))
open('assets/tray-icon-pause.png','wb').write(png(16,16,None))
"
```

- [ ] **Step 4: Verify tray and notifications**

```bash
npm start
```

Expected:
- Tray icon appears in macOS menu bar
- Click tray → window shows
- Start timer → tray title updates to countdown
- Skip through a segment → macOS notification appears

- [ ] **Step 5: Commit**

```bash
git add main.js preload.js assets/
git commit -m "feat: tray icon, system notifications, single-instance lock"
```

---

### Task 6: Sleep recovery

**Files:**
- Modify: `main.js`
- Modify: `renderer.js`

- [ ] **Step 1: Add power monitor listener in main.js**

Add this after `app.whenReady()`:

```js
const { powerMonitor } = require('electron')

// Inside app.whenReady().then(() => { ... }) block, after createTray():
powerMonitor.on('resume', () => {
  if (win) win.webContents.send('system-resume')
})
```

- [ ] **Step 2: Expose resume event in preload.js**

Add to the `contextBridge.exposeInMainWorld('api', { ... })` object:

```js
onResume: (cb) => ipcRenderer.on('system-resume', cb),
```

- [ ] **Step 3: Handle resume in renderer.js**

Add after the `render()` call at the bottom of renderer.js:

```js
if (window.api && window.api.onResume) {
  window.api.onResume(() => {
    if (timer.running) {
      timer.tick(Date.now())
      if (timer.remaining <= 0) {
        timer.advance()
        lastMode = timer.mode
        fireNotification()
        timer.start(Date.now())
      }
      render()
    }
  })
}
```

- [ ] **Step 4: Verify (manual)**

```bash
npm start
```

Start a timer, put the Mac to sleep briefly (close lid), wake it. Expected: timer advanced correctly, notification fires if segment ended during sleep.

- [ ] **Step 5: Commit**

```bash
git add main.js preload.js renderer.js
git commit -m "feat: handle system sleep/resume"
```

---

### Task 7: Reset today count at midnight

**Files:**
- Modify: `renderer.js`

- [ ] **Step 1: Add midnight reset logic in renderer.js**

Add after the `savedToday` line at the top of renderer.js:

```js
const savedDate = localStorage.getItem('todayDate')
const todayDate = new Date().toDateString()
const resolvedTodayCount = savedDate === todayDate ? savedToday : 0
localStorage.setItem('todayDate', todayDate)
```

Then change:

```js
const timer = createTimer(savedToday)
```

to:

```js
const timer = createTimer(resolvedTodayCount)
```

- [ ] **Step 2: Verify**

```bash
npm start
```

Complete a pomodoro, verify count increases. In DevTools console:
```js
localStorage.setItem('todayDate', 'old date'); location.reload()
```
Expected: today count resets to 0.

- [ ] **Step 3: Commit**

```bash
git add renderer.js
git commit -m "feat: reset daily pomodoro count at midnight"
```

---

### Task 8: End-to-end smoke test

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: all 11 tests pass.

- [ ] **Step 2: Manual smoke test checklist**

```
npm start
```

Test each item:
- [ ] Timer counts down correctly (start, let run 5 seconds, remaining decreased by 5)
- [ ] Pause stops countdown, resume continues from same position
- [ ] Reset returns to full time of current mode
- [ ] Skip moves to next mode with notification
- [ ] Mode tabs switch mode when timer is stopped
- [ ] After 4 focus segments, enters long break
- [ ] Tray icon title shows countdown while running
- [ ] Closing window hides it (app stays in tray)
- [ ] Clicking tray icon shows window
- [ ] Right-click tray → Quit exits app

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete pomodoro app"
```
