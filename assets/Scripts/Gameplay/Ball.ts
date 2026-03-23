import { _decorator, Component, Node, Graphics, UITransform, Color, Vec2, Vec3, Size } from 'cc';
import { GameConfig, BallColor, GameEvents, GameState } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';
import { AudioManager } from '../Core/AudioManager';
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

        const steps = Math.ceil((this._getCurrentSpeed() * dt) / (this._radius * 0.5));
        const subDt = dt / steps;
        
        let posRef = { x: this.node.position.x, y: this.node.position.y };

        for (let i = 0; i < steps; i++) {
            posRef.x += this._velocity.x * subDt;
            posRef.y += this._velocity.y * subDt;

            // ─── Wall collisions ────────────────────────────
            // Left wall
            if (posRef.x - this._radius <= GameConfig.WALL_LEFT) {
                posRef.x = GameConfig.WALL_LEFT + this._radius;
                this._velocity.x = Math.abs(this._velocity.x);
            }
            // Right wall
            if (posRef.x + this._radius >= GameConfig.WALL_RIGHT) {
                posRef.x = GameConfig.WALL_RIGHT - this._radius;
                this._velocity.x = -Math.abs(this._velocity.x);
            }
            // Top wall
            if (posRef.y + this._radius >= GameConfig.WALL_TOP) {
                posRef.y = GameConfig.WALL_TOP - this._radius;
                this._velocity.y = -Math.abs(this._velocity.y);
            }

            // ─── Bottom — ball lost ─────────────────────────
            if (posRef.y - this._radius <= GameConfig.WALL_BOTTOM) {
                this._launched = false;
                EventManager.emit(GameEvents.BALL_LOST);
                return;
            }

            // ─── Paddle collision ───────────────────────────
            if (this.paddleNode) {
                this._checkPaddleCollision(posRef);
            }

            // ─── Brick collisions ───────────────────────────
            if (this.brickContainer && this._launched) {
                this._checkBrickCollisions(posRef);
            }
        }

        this.node.setPosition(posRef.x, posRef.y, 0);
    }

    // ─── Paddle bounce with angle calculation ───────────
    private _checkPaddleCollision(posRef: { x: number, y: number }): void {
        const bx = posRef.x;
        const by = posRef.y;
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
            
            // Juice: Play heavy bonk
            if (AudioManager.instance) AudioManager.instance.playPaddleBonk();
            
            // Hardcore Rules: Punish players touching the Paddle natively resetting the combo
            GameManager.instance.resetCombo();

            // Calculate bounce angle based on hit position
            const hitOffset = (bx - pp.x) / (pw / 2); // -1 to 1
            const maxAngle = GameConfig.BALL_MAX_ANGLE * Math.PI / 180;
            const angle = hitOffset * maxAngle;
            const speed = this._getCurrentSpeed();

            this._velocity.x = Math.sin(angle) * speed;
            this._velocity.y = Math.abs(Math.cos(angle) * speed);

            // Positional correction out of paddle
            posRef.y = paddleTop + this._radius;
        }
    }

    // ─── Brick collision checks ─────────────────────────
    private _checkBrickCollisions(posRef: { x: number, y: number }): void {
        const bx = posRef.x;
        const by = posRef.y;
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

                // Positional correction and velocity reflection
                if (minOverlapX < minOverlapY) {
                    this._velocity.x = -this._velocity.x;
                    posRef.x += (this._velocity.x > 0 ? 1 : -1) * (minOverlapX + 0.1);
                } else {
                    this._velocity.y = -this._velocity.y;
                    posRef.y += (this._velocity.y > 0 ? 1 : -1) * (minOverlapY + 0.1);
                }

                // Hardcore Rules: Reward player for aggressive brick combinations
                GameManager.instance.increaseCombo();

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
