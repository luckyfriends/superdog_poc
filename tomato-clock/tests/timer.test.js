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
