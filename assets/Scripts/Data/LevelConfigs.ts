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
//  LEVEL DEFINITIONS — 20 Procedural Scaling Levels
// ═══════════════════════════════════════════════════════════

function generate20Levels(): LevelConfig[] {
    const levels: LevelConfig[] = [];
    
    for (let i = 0; i < 20; i++) {
        // Linear increase of rows (min 5, max 9) and cols (min 6, max 8)
        const rows = Math.min(9, 5 + Math.floor(i / 4));
        const cols = Math.min(8, 6 + Math.floor(i / 5));
        
        // Procedurally build the brick map
        const map: BrickType[][] = [];
        
        // Calculate dynamic anomalies inclusion probabilities
        const allowDoubleHit = i >= 1;
        const allowInfectDoubleHit = i >= 3;
        const allowDoublePoints = i >= 4;
        const allowExplosive = i >= 6;
        const allowIndestructible = i >= 8;
        const allowInfectIndestructible = i >= 12;

        for (let r = 0; r < rows; r++) {
            const rowArr: BrickType[] = [];
            for (let c = 0; c < cols; c++) {
                
                // Base is always Normal or nothing depending on pattern, here we mostly fill
                let type = BrickType.Normal;
                
                const rand = Math.random();
                
                // Introduce escalating difficulty weighting
                if (allowInfectIndestructible && rand < 0.03) {
                    type = BrickType.InfectIndestructible;
                } else if (allowExplosive && rand < 0.07) {
                    type = BrickType.ExplosiveSide;
                } else if (allowIndestructible && rand < 0.12) {
                    type = BrickType.Indestructible;
                } else if (allowDoublePoints && rand < 0.16) {
                    type = BrickType.DoublePoints;
                } else if (allowInfectDoubleHit && rand < 0.22) {
                    type = BrickType.InfectDoubleHit;
                } else if (allowDoubleHit && rand < 0.40) {
                    type = BrickType.DoubleHit;
                }

                rowArr.push(type);
            }
            map.push(rowArr);
        }

        // Ball speed: ramps up 25 speed units per level securely instead of massive unplayable spikes
        const ballSpeed = 600 + (i * 25);

        levels.push({
            levelNumber: i + 1,
            rows,
            cols,
            bricks: gridFromMap(map),
            ballSpeed
        });
    }
    
    return levels;
}

/** 20 Scaled dynamic levels */
export const LevelConfigs: LevelConfig[] = generate20Levels();
