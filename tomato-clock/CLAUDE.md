# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Launch the Electron app
npm test         # Run Jest unit tests
npx jest tests/timer.test.js -t "test name"  # Run a single test by name
```

## Architecture

Electron dual-process app with strict contextIsolation:

- **`main.js`** — Main process. Creates `BrowserWindow` (360×480, fixed), system tray, and sends system notifications via Electron's `Notification` API. Listens for `notify` and `set-tray` IPC events from renderer. Sends `system-resume` to renderer on `powerMonitor` resume events.
- **`preload.js`** — contextBridge exposes `window.api` to the renderer: `notify(title, body)`, `setTray(text)`, `onResume(cb)`. This is the only safe IPC bridge; `nodeIntegration` is off.
- **`timer.js`** — Pure state machine (`createTimer(savedTodayCount)`). Uses UMD export pattern: `module.exports` when in Node/Jest, `window.TimerModule` when in browser. **Must stay dual-environment** — do not add Node-only imports. Loaded via `<script src="timer.js">` in `index.html`.
- **`renderer.js`** — Timer UI logic. Reads `window.TimerModule`. Drives SVG ring animation (circumference 553, `stroke-dashoffset`), mode tabs, progress dots, and localStorage persistence for daily count with midnight date-string reset.
- **`tests/timer.test.js`** — 14 Jest unit tests covering all state transitions. `require('../timer')` works because of the UMD pattern.

## Key Invariants

- `timer.segmentStart` tracks remaining time at the moment `start()` or `pause()` was called. `tick(now)` computes elapsed as `now - startTime`, then `remaining = segmentStart - elapsed`. This avoids drift from cumulative tick errors.
- When a segment expires in `tick()`, overshoot milliseconds are carried into the next segment's `startTime` so boundary precision is maintained.
- `pause()` must update `segmentStart = remaining` before clearing `startTime`; otherwise resume will recalculate from the wrong baseline.
- Window close hides (not quits) via `e.preventDefault()` + `win.hide()`. Quit only via tray menu → `app.exit(0)`.
- Single-instance enforced with `app.requestSingleInstanceLock()` at top of `main.js`.
