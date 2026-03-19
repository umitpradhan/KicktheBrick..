# Brick Breaker — Cocos Creator

A production-quality brick breaker game built with **Cocos Creator 3.8.8** (TypeScript).

## Cocos Creator Version

- **3.8.8** (or above)

## Game Features

- **3 Levels** with increasing difficulty (more brick types, faster ball)
- **3 Brick Types**: Normal (1 hit), Double-Hit (2 hits, changes color), Indestructible (immune)
- **Angle-based Paddle Bounce** — ball angle depends on hit position on paddle
- **Pause Menu** — Resume, Restart, Quit
- **Score System** — tracks points across levels
- **Clipboard Copy** — copies final score to Android clipboard via native Java bridge
- **Zero External Assets** — all visuals drawn with `cc.Graphics` (no image files)

## Architecture

```
Single Scene (approot) — all screens as toggled UI panels
├── AppRoot.ts       → bootstraps managers, creates panels
├── GameManager.ts   → singleton state machine (score, lives, levels)
├── ScreenManager.ts → toggles MainMenu / GamePlay / Result / Pause panels
├── EventManager.ts  → pub/sub event bus (decouples components)
├── BrickFactory.ts  → factory pattern for typed brick creation
└── LevelConfigs.ts  → data-driven level definitions
```

**Design Patterns**: Singleton, Factory, Observer/Event Bus, State Machine, Data-Driven Design

## How to Run

1. Open the project folder in **Cocos Creator 3.8.8+**
2. Open `assets/Scene/approot.scene`
3. Attach the `AppRoot` component to the **Canvas** node (if not already attached)
4. Click **Play** in the editor to run

## How to Play

| Action | Control |
|--------|---------|
| Move Paddle | Mouse move / Touch drag |
| Launch Ball | Click / Tap anywhere |
| Pause | Tap the pause button (top-right) |

## Android Build

1. In Cocos Creator: **Project → Build → Android**
2. Build & compile to generate APK
3. The `ClipboardHelper.java` native class at `native/engine/android/app/src/com/cocos/game/` enables the "Copy Score" button on the Result screen

## Adding New Levels

Open `assets/Scripts/Data/LevelConfigs.ts` and add a new `LevelConfig` object to the array:

```typescript
const level4: LevelConfig = {
    levelNumber: 4,
    rows: 8,
    cols: 10,
    bricks: gridFromMap([...]),  // use N, D, I shorthand
    ballSpeed: 700,
};

export const LevelConfigs = [level1, level2, level3, level4];
```

## Adding New Brick Types

1. Add enum value in `Constants.ts` → `BrickType`
2. Add color in `Constants.ts` → `BrickColors`
3. Add hit logic in `Brick.ts` → `init()` and `onHit()`
4. Update `BrickFactory.ts` if special rendering needed

## Project Structure

```
assets/Scripts/
├── Core/           Constants, EventManager, GameManager
├── Gameplay/       Ball, Paddle, Brick, BrickFactory, BrickManager
├── UI/             ScreenManager, MainMenuUI, GamePlayUI, PauseMenuUI, ResultScreenUI
├── Data/           LevelConfigs (3 levels)
├── Native/         NativeBridge (Android clipboard)
└── AppRoot.ts      Entry point

native/engine/android/app/src/com/cocos/game/
└── ClipboardHelper.java    Android clipboard bridge
```
