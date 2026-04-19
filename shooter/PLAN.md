# Top-Down Shooter Game Plan

## Context
Building a retro 2D top-down shooter in a new `shooter/` folder as a single `shooter.html` file — no build step, runs directly in the browser. HTML5 Canvas, vanilla JS, 3 levels with clear progression.

---

## File
`shooter/shooter.html` — one file, all CSS + HTML + JS inline.

---

## Architecture

### State Machine
```
MENU → PLAYING → LEVEL_COMPLETE → (next level or WIN) → GAME_OVER
```

### Game Loop
- `requestAnimationFrame` loop
- `update(dt)` — move player, enemies, bullets; check collisions; run AI
- `render()` — clear canvas, draw all layers

---

## Features

### 1. Menu Screen
- Retro pixel-font title "SURVIVOR"
- "PLAY" button, brief controls reminder
- Scanline overlay for retro feel

### 2. Player
- Drawn with Canvas 2D (pixel-art style shapes, no external images)
- **Move**: Arrow keys (or WASD)
- **Aim**: Mouse position — player body rotates to face cursor
- **Shoot**: Left click — fires bullet toward cursor
- **Walk animation**: 4-frame leg cycle driven by frame counter
- **Gun**: extends from player body toward mouse direction
- **Health**: 3 HP, brief invincibility after hit

### 3. Bullets
- Travel in mouse-aim direction at fixed speed
- Removed on hit or off-screen
- Muzzle flash effect (1-2 frame bright circle)

### 4. Enemies (Canvas-drawn, distinct shapes per type)
| Type | Shape | Behavior | Appears |
|------|-------|----------|---------|
| Grunt | Red circle + eyes | Walk straight at player | Level 1+ |
| Charger | Orange triangle | Fast lunge when close | Level 2+ |
| Tank | Purple square | Slow, takes 3 hits | Level 3 |

- Spawn from random edge positions, walk toward player
- Simple separation steering (don't stack on each other)
- Death animation: explode into pixel particles

### 5. Levels
| Level | Enemies | New mechanic |
|-------|---------|-------------|
| 1 | 12 grunts | Intro — slow, spaced |
| 2 | 20 grunts + 8 chargers | Chargers introduced |
| 3 | 15 grunts + 10 chargers + 5 tanks | Tanks + tighter arena |

- "LEVEL COMPLETE" splash → 2s pause → next level
- Enemy count shown as "remaining" HUD counter

### 6. HUD
- Top-left: health hearts (drawn as pixel hearts)
- Top-right: score + level indicator
- Bottom: "enemies remaining" count

### 7. Game Over / Win
- GAME OVER screen with score + "RETRY" button
- WIN screen after level 3 with total score

---

## Code Structure (inside single `<script>` tag)

```
Constants & config
State variables (gameState, player, enemies[], bullets[], particles[])
Input handling (keydown/keyup, mousemove, mousedown)
Entity factories (createPlayer, createEnemy, createBullet, createParticle)
Update functions (updatePlayer, updateEnemies, updateBullets, updateParticles)
Collision detection (circle vs circle, bullet vs enemy, enemy vs player)
Draw functions (drawPlayer, drawEnemy, drawBullet, drawHUD, drawMenu, etc.)
Level loader (loadLevel(n) — sets spawn count, enemy types, wave config)
Main loop (requestAnimationFrame)
```

---

## Visual Style
- Dark background (`#0a0a1a`) with subtle grid
- Neon accent colors: player = cyan, enemies = red/orange/purple, bullets = yellow
- Pixel-art font via CSS `font-family: monospace` + letter-spacing
- CRT scanline overlay using a semi-transparent striped canvas layer

---

## Verification
1. Open `shooter/shooter.html` in browser
2. Menu screen appears → click Play
3. Player moves with arrow keys, rotates to face mouse, shoots on click
4. Enemies spawn from edges and walk toward player
5. Bullets kill enemies, health depletes on contact
6. Level 2 and 3 unlock after clearing previous level
7. Game Over on death, Win screen after level 3
