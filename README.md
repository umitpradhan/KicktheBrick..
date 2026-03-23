# Brick Breaker — Cocos Creator

A production-quality brick breaker game built with **Cocos Creator 3.7.0** (TypeScript).

## Cocos Creator Version

- **3.7.0** (or above)

## Game Features

- **20 Levels** with increasing difficulty and star-based progression
- **Dynamic Instruction UI** — Programmatically generated overlay explaining rules, scoring, and bonus features
- **Customizable Paddle Shop** — Unlock new paddles with 2x score multipliers and increased width using coins
- **Advanced Physics** — Fixed sub-stepping to prevent ball tunneling (passing through bricks) at high speeds
- **Special Brick Types**:
  - **Normal (Blue)**: 1 hit (10 pts)
  - **Double-Hit (Orange)**: 2 hits (25 pts)
  - **Explosive (Red)**: Destroys horizontal neighbors
  - **Infected Double (Purple)**: Turns neighbors into Double-Hit bricks
  - **Infected Solid (Dark Steel)**: Turns neighbors into Indestructible
  - **Indestructible (Light Steel)**: Permanent obstacle
  - **Double Points (Gold)**: 2x score for that specific hit
- **Combo System** — Score multiplier increases for every brick hit without touching the paddle
- **Pause Menu** — Smooth resume/restart functionality with zero state reset on unpause
- **Clipboard Copy** — Native Java bridge for sharing final results

## Architecture

```
Single Scene (approot) — all screens as toggled UI panels
├── AppRoot.ts       → bootstraps managers, creates panels
├── GameManager.ts   → singleton state machine (score, lives, levels)
├── ScreenManager.ts → toggles MainMenu / GamePlay / Result / Pause panels
├── EventManager.ts  → pub/sub event bus (decouples components)
├── BrickManager.ts  → manages brick destruction and special effects
├── LevelConfigs.ts  → data-driven level definitions
└── UserData.ts      → persistence layer for coins, unlocks, and high scores
```

**Design Patterns**: Singleton, Factory, Observer/Event Bus, State Machine, Data-Driven Design, Fixed Sub-stepping Physics.

## How to Play

| Action         | Control                                        |
| -------------- | ---------------------------------------------- |
| Move Paddle    | Touch drag (supports micro-scroll suppression) |
| Launch Ball    | Tap anywhere                                   |
| Pause / Resume | Seamlessly pause without resetting level state |

## Android Build Pipeline (Modernized)

This project has been patched to support **modern Android Studio (2024+)** and **SDK 36**.

1. In Cocos Creator: **Project → Build → Android**
2. **Global Patch Applied**: The Cocos Creator 3.7.0 engine templates have been upgraded to:
   - **Android Gradle Plugin (AGP)**: 7.4.2
   - **Gradle Wrapper**: 7.5.1
   - **Java Version**: 11 or 17
3. Open the `build/android/proj` folder specifically in Android Studio to build the APK.

## Adding New Levels

Open `assets/Scripts/Data/LevelConfigs.ts` and add a new `LevelConfig` object to the array. Use shorthands for special bricks: `E` (Explosive), `ID` (Infected Double), `IS` (Infected Solid), `IP` (Double Points).

## Project Structure

```
assets/Scripts/
├── Core/           Constants, EventManager, GameManager
├── Gameplay/       Ball, Paddle, Brick, BrickManager
├── UI/             MainMenuUI, GamePlayUI, PauseMenuUI, ShopUI, InstructionUI, LevelDashboardUI
├── Data/           LevelConfigs, UserData
└── Native/         NativeBridge (Android clipboard)

native/engine/android/app/src/com/cocos/game/
└── ClipboardHelper.java    Android clipboard bridge
```

## Technical Challenges & Solutions

During development, several critical platform-specific and engine-level challenges were resolved:

### 1. High-Speed Physics (Tunneling)

- **Problem**: At high speeds (700+ units), the ball would occasionally "tunnel" (move entirely through) bricks because its displacement per frame surpassed the brick width.
- **Reasoning**: Cocos Creator's default `update(dt)` script moves the ball once per frame. If the frame rate dips or speed is too high, the ball "jumps" too far, skipping the collision check entirely.
- **Solution**: Implemented **Fixed Sub-stepping**. The delta time (`dt`) is now broken down into 5 smaller sub-steps. Within each frame, the ball moves 5 times smaller distances and checks for collisions at every step. This effectively multiplies the physics resolution by 5x without the overhead of a full physics engine.
- **Time to Solve**: **45 Minutes**. This involved debugging the precise "edge-hit" cases where the ball would get stuck, then adding positional correction to push the ball _outside_ the brick bounds upon collision.

### 2. Android Build Infrastructure (Gradle 7+ Sync)

- **Problem**: Stock Cocos 3.7.0 outputs AGP 4.1.0 and Gradle 6.5. This fatally crashes with `MavenPlugin` and `GUtil` errors on modern Android Studio versions (which enforce Java 17 and Gradle 7.5+).
- **Reasoning**: Newer Android Studio versions (2024+) no longer support the deprecated `maven` plugin used in AGP 4.x. Because Cocos Creator "rewrites" local project files on every compile, patching individual `build.gradle` files was ineffective.
- **Solution**: I located the **master templates** inside the `/Applications/Cocos/Creator/.../templates/android` installation folder. I manually updated these global templates to natively output **AGP 7.4.2** and **Gradle 7.5.1** code. This ensures that every future build is automatically compatible with modern SDKs (up to SDK 36) without crashing.
- **Time to Solve**: **90 Minutes**. This required deep tracing of the Gradle failure logs, locating the hidden Cocos application package structure on Mac, and safely rewriting the engine's core build scripts.

### 3. Mobile Touch Responsiveness (First-Click Bug)

- **Problem**: Standard UI buttons frequently failed to respond on the first tap on Android devices.
- **Reasoning**: Capacitive touchscreens often detect a microscopic slide when a thumb taps a button. Cocos interprets this as the start of a "Scroll" gesture and cancels the "Click" event to prevent accidental presses while scrolling.
- **Solution**: Swapped all programmatic UI listeners to `Node.EventType.TOUCH_END`. This bypasses the complex "scroll vs. click" logic and activates the button as soon as the finger is lifted, provided it's still over the node.
- **Time to Solve**: **20 Minutes**. Audited all 6+ programmatic UI scripts and performed a global listener replacement across the menu systems.

### 4. UI Animation Freezing (Pause Menu)

- **Problem**: Using `cc.director.pause()` to stop the engine would freeze "Slide-In" menu animations mid-flight, often leaving the Pause Menu stuck off-screen or invisible.
- **Reasoning**: When the engine clock is paused, all `cc.tween` animations stop instantly. If a menu is 10% through its slide-in animation when the pause hits, it stays at 10% opacity/position.
- **Solution**: Transitioned from time-based tweens to static snapping for system-critical panels. The Pause Menu now snaps instantly to `(0,0,0)` upon activation, guaranteeing visibility even when the game clock is frozen.
- **Time to Solve**: **15 Minutes**. Diagnosed the "empty panel" reports and removed the fragile animation logic during game-pause states.

### 5. Level State Coupling (Reset on Resume)

- **Problem**: Resuming the game after a pause would occasionally trigger a full level reset, destroying all currently broken bricks.
- **Reasoning**: The game was listening to the generic `GameState.Playing` state to build the level. Since "Resuming" also sets the state to `Playing`, it was inadvertently rebuilding the grid every time the user unpaused.
- **Solution**: Introduced a specific `GameEvents.LEVEL_START` event. We now only build the brick grid when this _specific_ event fires (on new game/next level), allowing general state changes to toggle the simulation without resetting the scene.
- **Time to Solve**: **30 Minutes**. This involved tracing the event bus across `GameManager`, `Constants`, and `GamePlayUI` to ensure clean separation of concerns.
