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

    /** The container node holding all bricks. Used by Ball for collision checks. */
    public get brickContainer(): Node | null { return this._brickContainer; }

    onLoad(): void {
        EventManager.on(GameEvents.BRICK_DESTROYED, this._onBrickDestroyed, this);
    }

    onDestroy(): void {
        EventManager.off(GameEvents.BRICK_DESTROYED, this._onBrickDestroyed, this);
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

        for (const brickCfg of config.bricks) {
            const x = startX + brickCfg.col * (brickW + gap);
            const y = startY - brickCfg.row * (brickH + gap);

            BrickFactory.createBrick(
                brickCfg.type,
                x, y,
                brickW, brickH,
                this._brickContainer
            );

            if (brickCfg.type !== BrickType.Indestructible) {
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

    private _onBrickDestroyed(brickNode: Node): void {
        this._destroyableCount--;
        if (this._destroyableCount <= 0) {
            EventManager.emit(GameEvents.LEVEL_COMPLETE);
        }
    }
}
