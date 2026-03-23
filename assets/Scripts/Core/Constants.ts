import { Color } from 'cc';

// ─── Brick Types ────────────────────────────────────────────
export enum BrickType {
    Normal = 0,
    DoubleHit = 1,
    Indestructible = 2,
    InfectDoubleHit = 3,         // Converts neighbors to DoubleHit
    InfectIndestructible = 4,    // Converts neighbors to Indestructible
    ExplosiveSide = 5,           // Destroys left & right bricks when hit
    DoublePoints = 6,            // Grants 2x points
}

// ─── Game States ────────────────────────────────────────────
export enum GameState {
    Menu,
    Playing,
    Paused,
    GameOver,
    LevelComplete,
    GameWon,
}

// ─── Event Strings ──────────────────────────────────────────
export const GameEvents = {
    BRICK_HIT: 'BRICK_HIT',
    BRICK_DESTROYED: 'BRICK_DESTROYED',
    BALL_LOST: 'BALL_LOST',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    GAME_OVER: 'GAME_OVER',
    SCORE_CHANGED: 'SCORE_CHANGED',
    LIVES_CHANGED: 'LIVES_CHANGED',
    STATE_CHANGED: 'STATE_CHANGED',
    SCREEN_SHAKE: 'SCREEN_SHAKE',
    COMBO_CHANGED: 'COMBO_CHANGED',
    POPUP_SCORE: 'POPUP_SCORE',
    TIMER_CHANGED: 'TIMER_CHANGED',
    LEVEL_START: 'LEVEL_START',
} as const;

// ─── Game Configuration ─────────────────────────────────────
export const GameConfig = {
    // Canvas (Portrait base)
    DESIGN_WIDTH: 720,
    DESIGN_HEIGHT: 1280,

    // Ball
    BALL_RADIUS: 10,
    BALL_BASE_SPEED: 600,
    BALL_MAX_ANGLE: 60,  // degrees from vertical

    // Paddle
    PADDLE_WIDTH: 140,
    PADDLE_HEIGHT: 18,
    PADDLE_Y: -540,       // near bottom in portrait
    PADDLE_CORNER_RADIUS: 9,

    // Bricks
    BRICK_WIDTH: 78,
    BRICK_HEIGHT: 26,
    BRICK_GAP: 4,
    BRICK_AREA_TOP_Y: 500,   // top of brick grid area (from center)
    BRICK_AREA_LEFT_X: -330,  // left edge of brick grid

    // Scoring
    NORMAL_BRICK_POINTS: 10,
    DOUBLE_HIT_BRICK_POINTS: 25,

    // Lives
    MAX_LIVES: 3,

    // Walls (portrait bounds)
    WALL_TOP: 600,
    WALL_BOTTOM: -600,
    WALL_LEFT: -350,
    WALL_RIGHT: 350,
};

// ─── Colors ──────────────────────────────────────────────────
export const PaddleColor = new Color(52, 152, 219); // Fallback Blue
export const BallColor = new Color(252, 219, 3); // Yellow

export interface PaddleSkin {
    id: number;
    name: string;
    price: number;
    powerDescription: string;
    unlockLevelsWon: number;
    unlockHighScore: number;
    color: Color;
}

export const PaddleTiers: PaddleSkin[] = [
    { id: 0, name: "Classic Blue", price: 0, powerDescription: "No Special Power", unlockLevelsWon: 0, unlockHighScore: 0, color: new Color(52, 152, 219) },
    // Early-Game Hook (Day 1 Retention hook)
    { id: 1, name: "Neon Green", price: 250, powerDescription: "+20% Paddle Width", unlockLevelsWon: 2, unlockHighScore: 500, color: new Color(46, 204, 113) },
    // Mid-Game Grind (Day 3 Retention hook)
    { id: 2, name: "Crimson Red", price: 1500, powerDescription: "Starts with +1 Extra Life", unlockLevelsWon: 8, unlockHighScore: 2500, color: new Color(231, 76, 60) },
    // Ultimate Late-Game Flex Sink (Day 7+ Retention hook)
    { id: 3, name: "Royal Gold", price: 10000, powerDescription: "Base Points x2 Multiplier", unlockLevelsWon: 20, unlockHighScore: 10000, color: new Color(241, 196, 15) },
];

export const DOUBLE_HIT_CRACKED_COLOR = new Color(211, 84, 0, 150); // Semi-transparent Orange

// ─── Brick Colors ───────────────────────────────────────────
export const BrickColors: { [key: number]: Color } = {
    [BrickType.Normal]: new Color(79, 195, 247, 255),               // #4FC3F7 blue
    [BrickType.DoubleHit]: new Color(255, 138, 101, 255),           // #FF8A65 orange
    [BrickType.Indestructible]: new Color(120, 144, 156, 255),      // #78909C steel
    [BrickType.InfectDoubleHit]: new Color(156, 39, 176, 255),      // #9C27B0 purple
    [BrickType.InfectIndestructible]: new Color(69, 90, 100, 255),  // #455A64 dark steel
    [BrickType.ExplosiveSide]: new Color(211, 47, 47, 255),         // #D32F2F bright red
    [BrickType.DoublePoints]: new Color(255, 213, 79, 255),         // #FFD54F gold
};
