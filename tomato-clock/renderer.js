const { createTimer, MODES, DURATIONS } = window.TimerModule

const CIRCUMFERENCE = 2 * Math.PI * 88 // ~553

const savedToday = parseInt(localStorage.getItem('todayCount') || '0', 10)
const savedDate = localStorage.getItem('todayDate')
const todayDate = new Date().toDateString()
const resolvedTodayCount = savedDate === todayDate ? savedToday : 0
localStorage.setItem('todayDate', todayDate)
const timer = createTimer(resolvedTodayCount)

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

let lastDotCount = -1
function updateDots() {
  const count = timer.pomodoroCount % 4
  if (count === lastDotCount) return
  lastDotCount = count
  els.dots.innerHTML = ''
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('div')
    dot.className = 'dot' + (i < count ? ' done' : '')
    els.dots.appendChild(dot)
  }
}

let lastRenderedMode = null
function updateTabs() {
  if (timer.mode === lastRenderedMode) return
  lastRenderedMode = timer.mode
  els.tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.mode === timer.mode)
  })
}

const MODE_LABELS = {
  [MODES.FOCUS]: 'FOCUS',
  [MODES.SHORT_BREAK]: 'BREAK',
  [MODES.LONG_BREAK]: 'LONG BREAK',
}

let lastSavedTodayCount = timer.todayCount
function render() {
  const total = DURATIONS[timer.mode]
  const timeStr = fmt(timer.remaining)
  els.display.textContent = timeStr
  els.label.textContent = MODE_LABELS[timer.mode]
  els.startPause.textContent = timer.running ? '⏸' : '▶'
  updateRing(timer.remaining, total)
  updateDots()
  updateTabs()
  els.progressLabel.textContent =
    `第 ${(timer.pomodoroCount % 4) + 1} / 4 个番茄 · 今日 ${timer.todayCount} 个`
  if (timer.todayCount !== lastSavedTodayCount) {
    lastSavedTodayCount = timer.todayCount
    localStorage.setItem('todayCount', timer.todayCount)
  }

  if (window.api) {
    window.api.setTray(timer.running ? timeStr : `⏸ ${timeStr}`)
  }
}

let intervalId = null

function tickAndCheck() {
  const modeBefore = timer.mode
  timer.tick(Date.now())
  render()
  if (timer.mode !== modeBefore) fireNotification()
}

function startTick() {
  if (intervalId) return
  intervalId = setInterval(tickAndCheck, 1000)
}

function stopTick() {
  clearInterval(intervalId)
  intervalId = null
}

function fireNotification() {
  if (!window.api) return
  if (timer.mode === MODES.FOCUS) {
    window.api.notify('专注时间到 🍅', `开始第 ${(timer.pomodoroCount % 4) + 1} 个番茄`)
  } else {
    const mins = DURATIONS[timer.mode] / 60
    window.api.notify('休息一下 🎉', `完成第 ${timer.pomodoroCount} 个番茄，休息 ${mins} 分钟`)
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
    render()
  })
})

render()

if (window.api && window.api.onResume) {
  window.api.onResume(() => {
    if (timer.running) tickAndCheck()
  })
}
