import { _decorator, Component, Node, Graphics, UITransform, input, Input,
    EventTouch, EventMouse, Vec3, Size, view } from 'cc';
import { GameConfig, PaddleTiers, GameState } from '../Core/Constants';
import { GameManager } from '../Core/GameManager';
import { UserData } from '../Data/UserData';

const { ccclass } = _decorator;

/**
 * Paddle — follows touch / mouse horizontal position.
 * Drawn as a rounded rectangle via cc.Graphics.
 */
@ccclass('Paddle')
export class Paddle extends Component {

    private _graphics: Graphics | null = null;
    private _width: number = GameConfig.PADDLE_WIDTH;
    private _halfWidth: number = GameConfig.PADDLE_WIDTH / 2;

    onLoad(): void {
        // Powerup Override: Neon Green (+20% Width)
        if (UserData.instance.equippedPaddleId === 1) {
            this._width = GameConfig.PADDLE_WIDTH * 1.2;
            this._halfWidth = this._width / 2;
        }

        // UITransform for active physical size tracking
        let ut = this.node.getComponent(UITransform);
        if (!ut) {
            ut = this.node.addComponent(UITransform);
        }
        ut.setContentSize(new Size(this._width, GameConfig.PADDLE_HEIGHT));
        ut.setAnchorPoint(0.5, 0.5);

        // Draw paddle correctly proportioned
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

        // Retrieve player's permanently equipped color
        const equippedId = UserData.instance.equippedPaddleId;
        const skin = PaddleTiers.find(t => t.id === equippedId) || PaddleTiers[0];

        this._graphics.clear();
        this._graphics.fillColor = skin.color;
        this._graphics.roundRect(
            -this._halfWidth,
            -GameConfig.PADDLE_HEIGHT / 2,
            this._width,
            GameConfig.PADDLE_HEIGHT,
            GameConfig.PADDLE_CORNER_RADIUS
        );
        this._graphics.fill();
    }
}
