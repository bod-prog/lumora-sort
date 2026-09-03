# Graph Report - lumora-sort  (2026-09-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 61 nodes · 167 edges · 9 communities (8 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f81d8c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- levels.js
- manifest.json
- openModal
- renderHome
- onTube
- onWin
- game.js
- startLevel
- sw.js

## God Nodes (most connected - your core abstractions)
1. `openModal()` - 16 edges
2. `onTube()` - 13 edges
3. `startLevel()` - 12 edges
4. `t()` - 11 edges
5. `renderHome()` - 10 edges
6. `onWin()` - 10 edges
7. `hint()` - 9 edges
8. `purchase()` - 9 edges
9. `bind()` - 9 edges
10. `generateLevel()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `hint()` --calls--> `canPour()`  [EXTRACTED]
  js/game.js → js/levels.js
- `onTube()` --calls--> `canPour()`  [EXTRACTED]
  js/game.js → js/levels.js
- `onTube()` --calls--> `doPour()`  [EXTRACTED]
  js/game.js → js/levels.js
- `startLevel()` --calls--> `generateDaily()`  [EXTRACTED]
  js/game.js → js/levels.js
- `startLevel()` --calls--> `generateLevel()`  [EXTRACTED]
  js/game.js → js/levels.js

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "levels.js"
Cohesion: 0.30
Nodes (11): canPour(), doPour(), generateDaily(), generateLevel(), hashString(), isSolved(), mulberry32(), PALETTE (+3 more)

### Community 1 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 2 - "openModal"
Cohesion: 0.57
Nodes (8): hint(), openModal(), purchase(), renderBoard(), save(), toast(), undo(), updateGameHud()

### Community 3 - "renderHome"
Cohesion: 0.52
Nodes (7): boot(), loseLife(), nextLifeLabel(), quitLevel(), refillLives(), renderHome(), showScreen()

### Community 4 - "onTube"
Cohesion: 0.40
Nodes (6): beep(), buzz(), onTube(), shake(), spark(), cloneTubes()

### Community 5 - "onWin"
Cohesion: 0.40
Nodes (5): onWin(), buyProduct(), PRODUCTS, shouldShowInterstitial(), simulateAd()

### Community 6 - "game.js"
Cohesion: 0.50
Nodes (4): closeModal(), defaultState(), load(), state

### Community 7 - "startLevel"
Cohesion: 0.60
Nodes (5): applyLang(), bind(), startLevel(), t(), today()

## Knowledge Gaps
- **11 isolated node(s):** `background_color`, `description`, `display`, `icons`, `name` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 12 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `generateLevel()` connect `levels.js` to `game.js`, `startLevel`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `onTube()` connect `onTube` to `levels.js`, `openModal`, `onWin`, `game.js`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `startLevel()` connect `startLevel` to `levels.js`, `openModal`, `renderHome`, `onTube`, `game.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `background_color`, `description`, `display` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._