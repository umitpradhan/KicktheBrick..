import { _decorator, Component, Node, Label, input, Input, EventTouch, Graphics, Color, UITransform } from 'cc';
import { GameConfig, GameEvents, GameState } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';
import { Ball } from '../Gameplay/Ball';
import { Paddle } from '../Gameplay/Paddle';
import { BrickManager } from '../Gameplay/BrickManager';

const { ccclass, property } = _decorator;

/**
 * GamePlayUI — orchestrator for gameplay.
 * HUD labels and gameplay nodes are wired via @property from the scene editor.
 * Listens to game events to update HUD and handle state transitions.
 */
@ccclass('GamePlayUI')
export class GamePlayUI extends Component {

    // ─── HUD labels (wired in editor) ──────────────────
    @property({ type: Label, tooltip: 'Score display label' })
    public scoreLabel: Label | null = null;

    @property({ type: Label, tooltip: 'Lives display label' })
    public livesLabel: Label | null = null;

    @property({ type: Label, tooltip: 'Level display label' })
    public levelLabel: Label | null = null;

    @property({ type: Node, tooltip: 'Pause button node' })
    public pauseButton: Node | null = null;

    // ─── Gameplay nodes (wired in editor) ──────────────
    @property({ type: Node, tooltip: 'Container node for gameplay elements' })
    public gameContainer: Node | null = null;

    // Gameplay components (resolved at runtime)
    private _ball: Ball | null = null;
    private _paddle: Paddle | null = null;
    private _brickManager: BrickManager | null = null;

    onLoad(): void {
        // Auto-resolve properties lost during hot-reload
        if (!this.scoreLabel) this.scoreLabel = this.node.getChildByName('ScoreLabel')?.getComponent(Label) || null;
        if (!this.livesLabel) this.livesLabel = this.node.getChildByName('LivesLabel')?.getComponent(Label) || null;
        if (!this.levelLabel) this.levelLabel = this.node.getChildByName('LevelLabel')?.getComponent(Label) || null;
        if (!this.pauseButton) this.pauseButton = this.node.getChildByName('PauseButton');
        if (!this.gameContainer) this.gameContainer = this.node.getChildByName('GameContainer');

        // Resolve gameplay components from gameContainer children
        if (this.gameContainer) {
            const paddleNode = this.gameContainer.getChildByName('Paddle');
            if (paddleNode) this._paddle = paddleNode.getComponent(Paddle);

            const ballNode = this.gameContainer.getChildByName('Ball');
            if (ballNode) {
                this._ball = ballNode.getComponent(Ball);
                if (this._ball && paddleNode) {
                    this._ball.paddleNode = paddleNode;
                }
            }


            const bmNode = this.gameContainer.getChildByName('BrickManager');
            if (bmNode) this._brickManager = bmNode.getComponent(BrickManager);
        }

        // Pause button handler
        if (this.pauseButton) {
            this.pauseButton.on(Node.EventType.TOUCH_END, this._onPausePressed, this);
        }

        // Event listeners
        EventManager.on(GameEvents.STATE_CHANGED, this._onStateChanged, this);
        EventManager.on(GameEvents.SCORE_CHANGED, this._onScoreChanged, this);
        EventManager.on(GameEvents.LIVES_CHANGED, this._onLivesChanged, this);
        EventManager.on(GameEvents.BALL_LOST, this._onBallLost, this);
        EventManager.on(GameEvents.LEVEL_COMPLETE, this._onLevelComplete, this);
        EventManager.on(GameEvents.BRICK_HIT, this._onBrickHit, this);

        // Tap to launch ball
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }

    onEnable(): void {
        this._updateResponsiveBounds();

        // Safe to draw walls here because Widget has applied layout transforms
        if (this.gameContainer) {
            const wallsNode = this.gameContainer.getChildByName('Walls');
            if (wallsNode) this._drawWalls(wallsNode);
        }

        if (GameManager.instance.state === GameState.Playing) {
            this.startLevel();
        }
    }

    onDestroy(): void {
        EventManager.off(GameEvents.STATE_CHANGED, this._onStateChanged, this);
        EventManager.off(GameEvents.SCORE_CHANGED, this._onScoreChanged, this);
        EventManager.off(GameEvents.LIVES_CHANGED, this._onLivesChanged, this);
        EventManager.off(GameEvents.BALL_LOST, this._onBallLost, this);
        EventManager.off(GameEvents.LEVEL_COMPLETE, this._onLevelComplete, this);
        EventManager.off(GameEvents.BRICK_HIT, this._onBrickHit, this);
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
        if (this.pauseButton) {
            this.pauseButton.off(Node.EventType.TOUCH_END, this._onPausePressed, this);
        }
    }

    // ─── Start / load level ─────────────────────────────
    public startLevel(): void {
        const gm = GameManager.instance;
        this._updateHUD();

        // Load bricks
        this._brickManager?.loadLevel(gm.currentLevel);

        // Give ball reference to brick container
        if (this._ball && this._brickManager) {
            this._ball.brickContainer = this._brickManager.brickContainer;
        }

        // Reset ball
        this._ball?.resetBall();
    }

    private _updateResponsiveBounds(): void {
        if (!this.gameContainer) return;
        const uiTrans = this.gameContainer.getComponent(UITransform);
        if (!uiTrans) return;

        // Force widget alignment layout to resolve now since it was just activated
        const widget = this.gameContainer.getComponent('cc.Widget') as any;
        if (widget && typeof widget.updateAlignment === 'function') {
            widget.updateAlignment();
        }

        const w = uiTrans.contentSize.width;
        const h = uiTrans.contentSize.height;

        // Container anchor is 0.5, 0.5, so local coords span from -w/2 to w/2
        GameConfig.WALL_TOP = h / 2;
        GameConfig.WALL_BOTTOM = -h / 2;
        GameConfig.WALL_LEFT = -w / 2;
        GameConfig.WALL_RIGHT = w / 2;

        // Give the paddle 60 units of breathing room from the bottom
        GameConfig.PADDLE_Y = GameConfig.WALL_BOTTOM + 60;
        
        // Ensure bricks spawn 60 units below the top wall
        GameConfig.BRICK_AREA_TOP_Y = GameConfig.WALL_TOP - 60;
    }

    private _drawWalls(wallNode: Node): void {
        const gfx = wallNode.getComponent(Graphics);
        if (!gfx) return;
        gfx.strokeColor = new Color(60, 60, 100, 255);
        gfx.lineWidth = 3;
        gfx.moveTo(GameConfig.WALL_LEFT, GameConfig.WALL_BOTTOM);
        gfx.lineTo(GameConfig.WALL_LEFT, GameConfig.WALL_TOP);
        gfx.lineTo(GameConfig.WALL_RIGHT, GameConfig.WALL_TOP);
        gfx.lineTo(GameConfig.WALL_RIGHT, GameConfig.WALL_BOTTOM);
        gfx.stroke();
    }

    // ─── Event handlers ─────────────────────────────────
    private _onStateChanged(state: GameState): void {
        if (state === GameState.Playing) {
            this.startLevel();
        }
    }

    private _onScoreChanged(score: number): void {
        if (this.scoreLabel) this.scoreLabel.string = `Score: ${score}`;
    }

    private _onLivesChanged(lives: number): void {
        if (this.livesLabel) this.livesLabel.string = `Lives: ${lives}`;
    }

    private _onBallLost(): void {
        const alive = GameManager.instance.loseLife();
        if (alive) {
            this._ball?.resetBall();
        }
    }

    private _onLevelComplete(): void {
        this.scheduleOnce(() => {
            GameManager.instance.nextLevel();
        }, 0.5);
    }

    private _onBrickHit(brickNode: Node): void {
        const brick = brickNode.getComponent('Brick') as any;
        if (brick && typeof brick.onHit === 'function') {
            brick.onHit();
        }
    }

    private _onTouchStart(event: EventTouch): void {
        if (GameManager.instance.state !== GameState.Playing) return;
        if (this._ball && !this._ball.isLaunched) {
            this._ball.launch();
        }
    }

    private _onPausePressed(): void {
        GameManager.instance.togglePause();
    }

    private _updateHUD(): void {
        const gm = GameManager.instance;
        if (this.scoreLabel) this.scoreLabel.string = `Score: ${gm.score}`;
        if (this.livesLabel) this.livesLabel.string = `Lives: ${gm.lives}`;
        if (this.levelLabel) this.levelLabel.string = `Level: ${gm.currentLevel + 1}`;
    }
}
