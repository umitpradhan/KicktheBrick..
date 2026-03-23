import { _decorator, Component, Node, Graphics, Color } from 'cc';
import { BrickType, BrickColors, DOUBLE_HIT_CRACKED_COLOR, GameConfig, GameEvents } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';

const { ccclass, property } = _decorator;

/**
 * Brick — type-based hit behavior.
 * Normal: 1 hit to destroy.
 * DoubleHit: 2 hits (changes color after first hit).
 * Indestructible: ignores hits, no points.
 */
@ccclass('Brick')
export class Brick extends Component {

    private _brickType: BrickType = BrickType.Normal;
    private _hitsRemaining: number = 1;
    private _points: number = 0;
    private _graphics: Graphics | null = null;
    private _width: number = GameConfig.BRICK_WIDTH;
    private _height: number = GameConfig.BRICK_HEIGHT;

    public row: number = -1;
    public col: number = -1;

    public get brickType(): BrickType { return this._brickType; }
    public get isDestroyable(): boolean { return this._brickType !== BrickType.Indestructible && this._brickType !== BrickType.InfectIndestructible; }

    /**
     * Initialize brick properties. Called by BrickFactory after node creation.
     */
    public init(type: BrickType, width: number, height: number, col: number, row: number): void {
        this._brickType = type;
        this._width = width;
        this._height = height;
        this.col = col;
        this.row = row;

        this._setupStats(type);

        this._graphics = this.node.getComponent(Graphics);
        this._draw(BrickColors[this._brickType]);
    }

    private _setupStats(type: BrickType): void {
        switch (type) {
            case BrickType.Normal:
            case BrickType.InfectDoubleHit:
            case BrickType.ExplosiveSide:
                this._hitsRemaining = 1;
                this._points = GameConfig.NORMAL_BRICK_POINTS;
                break;
            case BrickType.DoublePoints:
                this._hitsRemaining = 1;
                this._points = GameConfig.NORMAL_BRICK_POINTS * 2;
                break;
            case BrickType.DoubleHit:
                this._hitsRemaining = 2;
                this._points = GameConfig.DOUBLE_HIT_BRICK_POINTS;
                break;
            case BrickType.Indestructible:
            case BrickType.InfectIndestructible:
                this._hitsRemaining = -1; // never breaks
                this._points = 0;
                break;
        }
    }

    /**
     * Forcefully transform this brick into another type (e.g. from infectious hit).
     */
    public infect(newType: BrickType): void {
        if (!this.isDestroyable) return; // Cannot mutate indestructible 
        if (this._brickType === newType) return;
        
        this._brickType = newType;
        this._setupStats(newType);
        this._draw(BrickColors[this._brickType]);
    }

    /**
     * Called when ball hits this brick.
     */
    public onHit(): void {
        if (this._brickType === BrickType.Indestructible || this._brickType === BrickType.InfectIndestructible) {
            EventManager.emit(GameEvents.BRICK_HIT, this.node);
            return; // Indestructible — no effect, but still emits hit for infection triggers
        }

        this._hitsRemaining--;

        if (this._hitsRemaining <= 0) {
            // Formally query final evaluations validating combinations actively
            const rawPoints = this._points;
            const finalPoints = GameManager.instance.evaluateScore(rawPoints);
            const multi = GameManager.instance.comboMultiplier;

            // Trigger Juice Feedback Bubble explicitly mapping local structural coordinates
            EventManager.emit(GameEvents.POPUP_SCORE, {
                position: this.node.position.clone(),
                score: finalPoints,
                multiplier: multi
            });

            // Formalize brick destruction
            GameManager.instance.addScore(rawPoints);
            this.node.active = false;
            EventManager.emit(GameEvents.BRICK_DESTROYED, this.node);
            // Reclammation is handled explicitly by BrickManager.
        } else {
            // DoubleHit cracked — redraw with cracked color
            this._draw(DOUBLE_HIT_CRACKED_COLOR);
        }
    }

    private _draw(color: Color): void {
        if (!this._graphics) return;
        this._graphics.clear();
        this._graphics.fillColor = color;
        this._graphics.rect(
            -this._width / 2, -this._height / 2,
            this._width, this._height
        );
        this._graphics.fill();

        // Subtle border for visual depth
        this._graphics.strokeColor = new Color(255, 255, 255, 60);
        this._graphics.lineWidth = 1;
        this._graphics.rect(
            -this._width / 2, -this._height / 2,
            this._width, this._height
        );
        this._graphics.stroke();
    }
}
