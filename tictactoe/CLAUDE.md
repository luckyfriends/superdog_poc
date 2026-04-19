# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-file browser game: `tictactoe.html`. No build step, no dependencies, no package manager.

To run: open `tictactoe.html` directly in a browser.

## Architecture

All logic lives in one file with three sections:

- **CSS** (lines 7–100): dark-themed styles; `.win` class triggers pulse animation on winning cells
- **HTML** (lines 102–125): static 3×3 grid of `.cell` divs with `data-i` indices 0–8; scoreboard; reset button
- **JS** (lines 126–186): vanilla JS with no framework
  - `WINS`: hardcoded array of 8 winning index triples
  - `board[]`: flat 9-element state array (`''`, `'X'`, or `'O'`)
  - `scores`: session-only object `{ X, O, D }` — resets on page reload
  - `init()` resets board state and DOM for a new game without resetting scores
  - `checkWin()` scans `WINS` against `board[]` and returns the winning triple or `undefined`
  - Click handler on each cell drives the game loop: place mark → check win → check draw → swap player
