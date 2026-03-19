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
    // Canvas
    DESIGN_WIDTH: 960,
    DESIGN_HEIGHT: 640,

    // Ball
    BALL_RADIUS: 8,
    BALL_BASE_SPEED: 400,
    BALL_MAX_ANGLE: 60,  // degrees from vertical

    // Paddle
    PADDLE_WIDTH: 120,
    PADDLE_HEIGHT: 16,
    PADDLE_Y: -280,       // distance from center
    PADDLE_CORNER_RADIUS: 8,

    // Bricks
    BRICK_WIDTH: 80,
    BRICK_HEIGHT: 24,
    BRICK_GAP: 4,
    BRICK_AREA_TOP_Y: 280,   // top of brick grid area (from center)
    BRICK_AREA_LEFT_X: -340,  // left edge of brick grid

    // Scoring
    NORMAL_BRICK_POINTS: 10,
    DOUBLE_HIT_BRICK_POINTS: 25,

    // Lives
    MAX_LIVES: 3,

    // Walls
    WALL_TOP: 310,
    WALL_BOTTOM: -310,
    WALL_LEFT: -470,
    WALL_RIGHT: 470,
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
