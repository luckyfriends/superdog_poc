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
    if (state.running) return
    state.startTime = now
    state.running = true
  }

  state.pause = function () {
    state.running = false
    state.segmentStart = state.remaining  // anchor next tick calc at pause point
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
      state.mode = state.pomodoroCount % 4 === 0 ? MODES.LONG_BREAK : MODES.SHORT_BREAK
    } else {
      if (state.mode === MODES.LONG_BREAK) state.pomodoroCount = 0
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
      const elapsedMs = now - state.startTime
      const overMs = elapsedMs - state.segmentStart * 1000
      state.advance()
      state.running = true
      state.startTime = now - overMs
      state.remaining = state.segmentStart - Math.floor(overMs / 1000)
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
