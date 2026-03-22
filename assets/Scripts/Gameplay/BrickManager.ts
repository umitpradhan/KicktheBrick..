import { _decorator, Component, Node } from 'cc';
import { BrickType, GameConfig, GameEvents } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { BrickFactory } from './BrickFactory';
import { Brick } from './Brick';
import { LevelConfigs, LevelConfig } from '../Data/LevelConfigs';
import { GameManager } from '../Core/GameManager';

const { ccclass } = _decorator;

/**
 * BrickManager — reads level config, spawns brick grid, tracks completion.
 * Emits LEVEL_COMPLETE when all destroyable bricks are gone.
 */
@ccclass('BrickManager')
export class BrickManager extends Component {

    private _destroyableCount: number = 0;
    private _brickContainer: Node | null = null;
    private _brickGrid: (Brick | null)[][] = [];

    /** The container node holding all bricks. Used by Ball for collision checks. */
    public get brickContainer(): Node | null { return this._brickContainer; }

    onLoad(): void {
        EventManager.on(GameEvents.BRICK_DESTROYED, this._onBrickDestroyed, this);
        EventManager.on(GameEvents.BRICK_HIT, this._processSpecialHit, this);
    }

    onDestroy(): void {
        EventManager.off(GameEvents.BRICK_DESTROYED, this._onBrickDestroyed, this);
        EventManager.off(GameEvents.BRICK_HIT, this._processSpecialHit, this);
    }

    /**
     * Load and spawn bricks for the given level index.
     * Clears any previous bricks first.
     */
    public loadLevel(levelIndex: number): void {
        this.clearBricks();

        if (levelIndex < 0 || levelIndex >= LevelConfigs.length) {
            console.error(`BrickManager: invalid level index ${levelIndex}`);
            return;
        }

        const config = LevelConfigs[levelIndex];

        // Create a container node for all bricks
        this._brickContainer = new Node('BrickContainer');
        this.node.addChild(this._brickContainer);

        this._destroyableCount = 0;

        const brickW = GameConfig.BRICK_WIDTH;
        const brickH = GameConfig.BRICK_HEIGHT;
        const gap = GameConfig.BRICK_GAP;

        // Calculate grid total width to center it
        const gridWidth = config.cols * brickW + (config.cols - 1) * gap;
        const startX = -gridWidth / 2 + brickW / 2;
        const startY = GameConfig.BRICK_AREA_TOP_Y;

        // Initialize 2D grid matrix correctly
        this._brickGrid = [];
        for (let r = 0; r < config.rows; r++) {
            this._brickGrid[r] = new Array(config.cols).fill(null);
        }

        for (const brickCfg of config.bricks) {
            const x = startX + brickCfg.col * (brickW + gap);
            const y = startY - brickCfg.row * (brickH + gap);

            const brickNode = BrickFactory.createBrick(
                brickCfg.type,
                x, y,
                brickW, brickH,
                this._brickContainer,
                brickCfg.col,
                brickCfg.row
            );

            const brick = brickNode.getComponent(Brick)!;
            this._brickGrid[brickCfg.row][brickCfg.col] = brick;

            if (brick.isDestroyable) {
                this._destroyableCount++;
            }
        }
    }

    /** Remove all current bricks. */
    public clearBricks(): void {
        if (this._brickContainer) {
            this._brickContainer.destroyAllChildren();
            this._brickContainer.destroy();
            this._brickContainer = null;
        }
        this._destroyableCount = 0;
    }

    private _processSpecialHit(brickNode: Node): void {
        const brick = brickNode.getComponent(Brick);
        if (!brick) return;

        if (brick.brickType === BrickType.InfectDoubleHit) {
            this._infectNeighbors(brick.row, brick.col, BrickType.DoubleHit);
        } else if (brick.brickType === BrickType.InfectIndestructible) {
            this._infectNeighbors(brick.row, brick.col, BrickType.Indestructible);
        }
    }

    private _infectNeighbors(row: number, col: number, type: BrickType): void {
        const neighbors = [
            { r: row - 1, c: col },
            { r: row + 1, c: col },
            { r: row, c: col - 1 },
            { r: row, c: col + 1 }
        ];

        for (const n of neighbors) {
            if (this._brickGrid[n.r] && this._brickGrid[n.r][n.c]) {
                const target = this._brickGrid[n.r][n.c]!;
                if (target.node.active && target.isDestroyable && target.brickType !== type) {
                    
                    // Tracking destroyable limits when turning indestructible magically
                    if (type === BrickType.Indestructible) {
                        this._destroyableCount--;
                    }
                    target.infect(type);
                    
                    if (this._destroyableCount <= 0) {
                        EventManager.emit(GameEvents.LEVEL_COMPLETE);
                    }
                }
            }
        }
    }

    private _onBrickDestroyed(brickNode: Node): void {
        const brick = brickNode.getComponent(Brick);
        if (brick) {
            this._brickGrid[brick.row][brick.col] = null;

            // Handle explosive side effects safely checking boundaries
            if (brick.brickType === BrickType.ExplosiveSide) {
                const left = this._brickGrid[brick.row][brick.col - 1];
                if (left && left.node.active) left.onHit();

                const right = this._brickGrid[brick.row][brick.col + 1];
                if (right && right.node.active) right.onHit();
            }
        }

        this._destroyableCount--;
        if (this._destroyableCount <= 0) {
            EventManager.emit(GameEvents.LEVEL_COMPLETE);
        }
    }
}
