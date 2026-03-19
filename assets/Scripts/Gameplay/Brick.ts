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

    public get brickType(): BrickType { return this._brickType; }
    public get isDestroyable(): boolean { return this._brickType !== BrickType.Indestructible; }

    /**
     * Initialize brick properties. Called by BrickFactory after node creation.
     */
    public init(type: BrickType, width: number, height: number): void {
        this._brickType = type;
        this._width = width;
        this._height = height;

        switch (type) {
            case BrickType.Normal:
                this._hitsRemaining = 1;
                this._points = GameConfig.NORMAL_BRICK_POINTS;
                break;
            case BrickType.DoubleHit:
                this._hitsRemaining = 2;
                this._points = GameConfig.DOUBLE_HIT_BRICK_POINTS;
                break;
            case BrickType.Indestructible:
                this._hitsRemaining = -1; // never breaks
                this._points = 0;
                break;
        }

        this._graphics = this.node.getComponent(Graphics);
        this._draw(BrickColors[type]);
    }

    /**
     * Called when ball hits this brick.
     */
    public onHit(): void {
        if (this._brickType === BrickType.Indestructible) {
            return; // Indestructible — no effect
        }

        this._hitsRemaining--;

        if (this._hitsRemaining <= 0) {
            // Brick destroyed
            GameManager.instance.addScore(this._points);
            EventManager.emit(GameEvents.BRICK_DESTROYED, this.node);
            this.node.active = false;
            this.node.destroy();
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
