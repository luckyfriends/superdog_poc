# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

Open `shooter.html` directly in any browser — no build step, no server required.

## Architecture

The entire game is a single self-contained file (`shooter.html`) with inline CSS and JavaScript. All game logic lives inside one `<script>` tag organized as follows:

**State machine:** `MENU → PLAYING → LEVEL_COMPLETE → (next level or WIN) → GAME_OVER`

Global `gs` variable holds the current state string. The main `loop()` function (driven by `requestAnimationFrame`) calls `update(dt)` then dispatches to the appropriate draw function based on `gs`.

**Key globals:**
- `player` — single object with position, hp, timers, walk cycle
- `enemies[]`, `bullets[]`, `particles[]`, `flashes[]` — entity arrays
- `spawnQueue[]` — shuffled array of enemy type strings consumed by `checkSpawn()`
- `keys{}`, `mouse{}`, `mouseHeld` — raw input state

**Sections (in order in the script):**
1. Canvas/context setup + pre-rendered scanline overlay (`scanOC`)
2. Constants (speeds, radii, timings)
3. State variables
4. Factories: `createPlayer()`, `spawnEnemy(type)`, `fireBullet()`, `burst()`
5. Level loader: `loadLevel(n)` reads from `LEVEL_DEFS[]` (index 1–3), shuffles spawn queue
6. Update functions: `updatePlayer`, `updateEnemies`, `updateBullets`, `updateParticles`, `updateFlashes`, `checkSpawn`, `checkLevelComplete`
7. Draw helpers: `drawBg()`, `scanlines()`, `pixelHeart()`
8. Entity draw functions: `drawPlayer()`, `drawEnemy(e)`, `drawBullets()`, `drawFlashes()`, `drawParticles()`, `drawHUD()`
9. Screen draw functions: `drawMenu()`, `drawGameOver()`, `drawWin()`
10. Main loop + input event listeners

**Enemy types** (defined in `spawnEnemy` via `base` lookup):
- `grunt` — red circle, walks straight at player
- `charger` — orange triangle, fast-lunges when within 160px
- `tank` — purple square, 3 HP, shows turret + HP bar

**Collision** is circle-vs-circle everywhere. Player radius = `PLAYER_R` (14), enemy radii vary by type. Bullet hits remove both bullet and decrement enemy HP.

**Canvas coordinates** are always logical (800×600); mouse events are scaled via `canvasMouse()` to account for CSS scaling.
