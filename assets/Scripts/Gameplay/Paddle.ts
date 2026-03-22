import { _decorator, Component, Node, Graphics, UITransform, input, Input,
    EventTouch, EventMouse, Vec3, Size, view } from 'cc';
import { GameConfig, PaddleColor, GameState } from '../Core/Constants';
import { GameManager } from '../Core/GameManager';

const { ccclass } = _decorator;

/**
 * Paddle — follows touch / mouse horizontal position.
 * Drawn as a rounded rectangle via cc.Graphics.
 */
@ccclass('Paddle')
export class Paddle extends Component {

    private _graphics: Graphics | null = null;
    private _halfWidth: number = GameConfig.PADDLE_WIDTH / 2;

    onLoad(): void {
        // UITransform for size
        let ut = this.node.getComponent(UITransform);
        if (!ut) {
            ut = this.node.addComponent(UITransform);
        }
        ut.setContentSize(new Size(GameConfig.PADDLE_WIDTH, GameConfig.PADDLE_HEIGHT));
        ut.setAnchorPoint(0.5, 0.5);

        // Draw paddle
        this._graphics = this.node.getComponent(Graphics) || this.node.addComponent(Graphics);
        this._drawPaddle();

        // Position
        this.node.setPosition(0, GameConfig.PADDLE_Y, 0);

        // Input listeners
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.on(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_MOVE, this._onTouchMove, this);
        input.off(Input.EventType.MOUSE_MOVE, this._onMouseMove, this);
    }

    private _onTouchMove(event: EventTouch): void {
        if (GameManager.instance.state !== GameState.Playing) return;
        const loc = event.getUILocation();
        this._moveTo(loc.x);
    }

    private _onMouseMove(event: EventMouse): void {
        if (GameManager.instance.state !== GameState.Playing) return;
        const loc = event.getUILocation();
        this._moveTo(loc.x);
    }

    /**
     * Move paddle to the given screen-x, converting to local coords
     * and clamping to wall boundaries.
     */
    private _moveTo(screenX: number): void {
        // Convert screen-space x to canvas-space (origin at center)
        const visibleSize = view.getVisibleSize();
        const localX = screenX - visibleSize.width / 2;

        // Clamp so paddle stays within walls
        const minX = GameConfig.WALL_LEFT + this._halfWidth;
        const maxX = GameConfig.WALL_RIGHT - this._halfWidth;
        const clampedX = Math.max(minX, Math.min(maxX, localX));

        this.node.setPosition(clampedX, GameConfig.PADDLE_Y, 0);
    }

    private _drawPaddle(): void {
        if (!this._graphics) return;
        this._graphics.clear();
        this._graphics.fillColor = PaddleColor;
        this._graphics.roundRect(
            -GameConfig.PADDLE_WIDTH / 2,
            -GameConfig.PADDLE_HEIGHT / 2,
            GameConfig.PADDLE_WIDTH,
            GameConfig.PADDLE_HEIGHT,
            GameConfig.PADDLE_CORNER_RADIUS
        );
        this._graphics.fill();
    }
}
