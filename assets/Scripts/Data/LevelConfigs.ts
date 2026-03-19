import { BrickType } from '../Core/Constants';

/**
 * Configuration for a single brick in a level layout.
 */
export interface BrickConfig {
    type: BrickType;
    col: number;
    row: number;
}

/**
 * Configuration for an entire level.
 * To add a new level, simply push another LevelConfig into the array.
 */
export interface LevelConfig {
    levelNumber: number;
    rows: number;
    cols: number;
    bricks: BrickConfig[];
    ballSpeed: number;
}

// ─── Helper: fill full grid with one type ───────────────────
function fullGrid(rows: number, cols: number, type: BrickType): BrickConfig[] {
    const bricks: BrickConfig[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            bricks.push({ type, col: c, row: r });
        }
    }
    return bricks;
}

// ─── Helper: build mixed grid from a 2D type map ───────────
function gridFromMap(map: BrickType[][]): BrickConfig[] {
    const bricks: BrickConfig[] = [];
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            bricks.push({ type: map[r][c], col: c, row: r });
        }
    }
    return bricks;
}

// ═══════════════════════════════════════════════════════════
//  LEVEL DEFINITIONS — add new levels here
// ═══════════════════════════════════════════════════════════

const N = BrickType.Normal;
const D = BrickType.DoubleHit;
const I = BrickType.Indestructible;

/**
 * Level 1 — 5×8, all Normal bricks, standard speed.
 */
const level1: LevelConfig = {
    levelNumber: 1,
    rows: 5,
    cols: 8,
    bricks: fullGrid(5, 8, BrickType.Normal),
    ballSpeed: 400,
};

/**
 * Level 2 — 6×8, Normal + DoubleHit mix, faster ball.
 */
const level2: LevelConfig = {
    levelNumber: 2,
    rows: 6,
    cols: 8,
    bricks: gridFromMap([
        [N, D, N, D, N, D, N, D],
        [D, N, D, N, D, N, D, N],
        [N, N, D, D, D, D, N, N],
        [D, D, N, N, N, N, D, D],
        [N, D, N, D, N, D, N, D],
        [D, N, D, N, D, N, D, N],
    ]),
    ballSpeed: 500,
};

/**
 * Level 3 — 7×8, Normal + DoubleHit + Indestructible, fastest ball.
 */
const level3: LevelConfig = {
    levelNumber: 3,
    rows: 7,
    cols: 8,
    bricks: gridFromMap([
        [I, N, D, N, N, D, N, I],
        [N, D, N, D, D, N, D, N],
        [D, N, I, N, N, I, N, D],
        [N, N, D, D, D, D, N, N],
        [D, N, I, N, N, I, N, D],
        [N, D, N, D, D, N, D, N],
        [I, N, D, N, N, D, N, I],
    ]),
    ballSpeed: 600,
};

/** All levels — extend this array to add more levels. */
export const LevelConfigs: LevelConfig[] = [level1, level2, level3];
