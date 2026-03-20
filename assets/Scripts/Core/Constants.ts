import { Color } from 'cc';

// ─── Brick Types ────────────────────────────────────────────
export enum BrickType {
    Normal = 0,
    DoubleHit = 1,
    Indestructible = 2,
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
} as const;

// ─── Game Configuration ─────────────────────────────────────
export const GameConfig = {
    // Canvas (Portrait)
    DESIGN_WIDTH: 720,
    DESIGN_HEIGHT: 1280,

    // Ball
    BALL_RADIUS: 10,
    BALL_BASE_SPEED: 400,
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

// ─── Brick Colors ───────────────────────────────────────────
export const BrickColors: { [key: number]: Color } = {
    [BrickType.Normal]: new Color(79, 195, 247, 255),           // #4FC3F7 blue
    [BrickType.DoubleHit]: new Color(255, 138, 101, 255),       // #FF8A65 orange
    [BrickType.Indestructible]: new Color(120, 144, 156, 255),  // #78909C steel
};

export const DOUBLE_HIT_CRACKED_COLOR = new Color(239, 83, 80, 255); // #EF5350 red

export const PaddleColor = new Color(224, 224, 224, 255);  // #E0E0E0
export const BallColor = new Color(255, 255, 255, 255);     // #FFFFFF
