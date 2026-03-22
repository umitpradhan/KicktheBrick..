import { _decorator, Component, Node, Graphics, UITransform, Color, Vec2, Vec3, Size } from 'cc';
import { GameConfig, BallColor, GameEvents, GameState } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';
import { LevelConfigs } from '../Data/LevelConfigs';

const { ccclass } = _decorator;

/**
 * Ball — manual velocity-based movement with AABB collision.
 * No Cocos physics engine. Drawn as a filled circle via cc.Graphics.
 */
@ccclass('Ball')
export class Ball extends Component {

    private _velocity: Vec2 = new Vec2(0, 0);
    private _graphics: Graphics | null = null;
    private _launched: boolean = false;
    private _radius: number = GameConfig.BALL_RADIUS;

    // Cache paddle reference (set by GamePlayUI)
    public paddleNode: Node | null = null;
    // Cache brick container (set by GamePlayUI)
    public brickContainer: Node | null = null;

    onLoad(): void {
        // Add UITransform so the node has a size for positioning
        let ut = this.node.getComponent(UITransform);
        if (!ut) {
            ut = this.node.addComponent(UITransform);
        }
        ut.setContentSize(new Size(this._radius * 2, this._radius * 2));
        ut.setAnchorPoint(0.5, 0.5);

        // Draw ball
        this._graphics = this.node.getComponent(Graphics) || this.node.addComponent(Graphics);
        this._drawBall();
    }

    /** Reset ball to paddle top and stop movement. */
    public resetBall(): void {
        this._launched = false;
        this._velocity.set(0, 0);
        this._positionOnPaddle();
    }

    /** Launch ball upwards with slight angle. */
    public launch(): void {
        if (this._launched) return;
        this._launched = true;
        const speed = this._getCurrentSpeed();
        // Launch at a slight random angle so it's not perfectly vertical
        const angle = (Math.random() * 40 - 20) * Math.PI / 180; // -20° to +20°
        this._velocity.set(Math.sin(angle) * speed, Math.cos(angle) * speed);
    }

    public get isLaunched(): boolean {
        return this._launched;
    }

    update(dt: number): void {
        if (GameManager.instance.state !== GameState.Playing) return;

        if (!this._launched) {
            this._positionOnPaddle();
            return;
        }

        const pos = this.node.position;
        let nx = pos.x + this._velocity.x * dt;
        let ny = pos.y + this._velocity.y * dt;

        // ─── Wall collisions ────────────────────────────
        // Left wall
        if (nx - this._radius <= GameConfig.WALL_LEFT) {
            nx = GameConfig.WALL_LEFT + this._radius;
            this._velocity.x = Math.abs(this._velocity.x);
        }
        // Right wall
        if (nx + this._radius >= GameConfig.WALL_RIGHT) {
            nx = GameConfig.WALL_RIGHT - this._radius;
            this._velocity.x = -Math.abs(this._velocity.x);
        }
        // Top wall
        if (ny + this._radius >= GameConfig.WALL_TOP) {
            ny = GameConfig.WALL_TOP - this._radius;
            this._velocity.y = -Math.abs(this._velocity.y);
        }

        // ─── Bottom — ball lost ─────────────────────────
        if (ny - this._radius <= GameConfig.WALL_BOTTOM) {
            this._launched = false;
            EventManager.emit(GameEvents.BALL_LOST);
            return;
        }

        // ─── Paddle collision ───────────────────────────
        if (this.paddleNode) {
            this._checkPaddleCollision(nx, ny);
        }

        // ─── Brick collisions ───────────────────────────
        if (this.brickContainer) {
            this._checkBrickCollisions(nx, ny);
        }

        this.node.setPosition(nx, ny, 0);
    }

    // ─── Paddle bounce with angle calculation ───────────
    private _checkPaddleCollision(bx: number, by: number): void {
        const paddle = this.paddleNode!;
        const pp = paddle.position;
        const put = paddle.getComponent(UITransform)!;
        const pw = put.contentSize.width;
        const ph = put.contentSize.height;

        const paddleLeft = pp.x - pw / 2;
        const paddleRight = pp.x + pw / 2;
        const paddleTop = pp.y + ph / 2;
        const paddleBottom = pp.y - ph / 2;

        // AABB overlap check
        if (bx + this._radius > paddleLeft &&
            bx - this._radius < paddleRight &&
            by - this._radius < paddleTop &&
            by + this._radius > paddleBottom &&
            this._velocity.y < 0) {
            // Calculate bounce angle based on hit position
            const hitOffset = (bx - pp.x) / (pw / 2); // -1 to 1
            const maxAngle = GameConfig.BALL_MAX_ANGLE * Math.PI / 180;
            const angle = hitOffset * maxAngle;
            const speed = this._getCurrentSpeed();

            this._velocity.x = Math.sin(angle) * speed;
            this._velocity.y = Math.abs(Math.cos(angle) * speed);
        }
    }

    // ─── Brick collision checks ─────────────────────────
    private _checkBrickCollisions(bx: number, by: number): void {
        const bricks = this.brickContainer!.children;
        for (let i = bricks.length - 1; i >= 0; i--) {
            const brick = bricks[i];
            if (!brick.active) continue;

            const bp = brick.position;
            const but = brick.getComponent(UITransform);
            if (!but) continue;
            const bw = but.contentSize.width;
            const bh = but.contentSize.height;

            const brickLeft = bp.x - bw / 2;
            const brickRight = bp.x + bw / 2;
            const brickTop = bp.y + bh / 2;
            const brickBottom = bp.y - bh / 2;

            // AABB circle-vs-rect overlap
            const closestX = Math.max(brickLeft, Math.min(bx, brickRight));
            const closestY = Math.max(brickBottom, Math.min(by, brickTop));
            const dx = bx - closestX;
            const dy = by - closestY;

            if (dx * dx + dy * dy < this._radius * this._radius) {
                // Determine reflection direction
                const overlapLeft = (bx + this._radius) - brickLeft;
                const overlapRight = brickRight - (bx - this._radius);
                const overlapTop = brickTop - (by - this._radius);
                const overlapBottom = (by + this._radius) - brickBottom;
                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    this._velocity.x = -this._velocity.x;
                } else {
                    this._velocity.y = -this._velocity.y;
                }

                // Notify brick
                EventManager.emit(GameEvents.BRICK_HIT, brick);

                // Only collide with one brick per frame
                break;
            }
        }
    }

    private _positionOnPaddle(): void {
        if (!this.paddleNode) return;
        const pp = this.paddleNode.position;
        const pUT = this.paddleNode.getComponent(UITransform);
        const ph = pUT ? pUT.contentSize.height : GameConfig.PADDLE_HEIGHT;
        this.node.setPosition(pp.x, pp.y + ph / 2 + this._radius + 2, 0);
    }

    private _getCurrentSpeed(): number {
        const lvlIdx = Math.min(GameManager.instance.currentLevel, LevelConfigs.length - 1);
        const cfg = LevelConfigs[lvlIdx];
        if (cfg) {
            return cfg.ballSpeed;
        }
        return GameConfig.BALL_BASE_SPEED + lvlIdx * 25;
    }

    private _drawBall(): void {
        if (!this._graphics) return;
        this._graphics.clear();
        this._graphics.fillColor = BallColor;
        this._graphics.circle(0, 0, this._radius);
        this._graphics.fill();
    }
}
