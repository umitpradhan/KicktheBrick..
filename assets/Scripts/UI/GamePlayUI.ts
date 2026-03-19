import { _decorator, Component, Node, Label, UITransform, Graphics, Color,
    Size, input, Input, EventTouch } from 'cc';
import { GameConfig, GameEvents, GameState } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';
import { Ball } from '../Gameplay/Ball';
import { Paddle } from '../Gameplay/Paddle';
import { BrickManager } from '../Gameplay/BrickManager';

const { ccclass } = _decorator;

/**
 * GamePlayUI — orchestrator for gameplay.
 * Creates Ball, Paddle, BrickManager nodes and the HUD (score, lives, level, pause btn).
 * Listens to game events to update HUD and handle state transitions.
 */
@ccclass('GamePlayUI')
export class GamePlayUI extends Component {

    // HUD labels
    private _scoreLabel: Label | null = null;
    private _livesLabel: Label | null = null;
    private _levelLabel: Label | null = null;

    // Gameplay nodes
    private _ball: Ball | null = null;
    private _paddle: Paddle | null = null;
    private _brickManager: BrickManager | null = null;

    // Gameplay container (holds ball, paddle, bricks)
    private _gameContainer: Node | null = null;

    onLoad(): void {
        this._buildHUD();
        this._buildGameContainer();

        // Event listeners
        EventManager.on(GameEvents.STATE_CHANGED, this._onStateChanged, this);
        EventManager.on(GameEvents.SCORE_CHANGED, this._onScoreChanged, this);
        EventManager.on(GameEvents.LIVES_CHANGED, this._onLivesChanged, this);
        EventManager.on(GameEvents.BALL_LOST, this._onBallLost, this);
        EventManager.on(GameEvents.LEVEL_COMPLETE, this._onLevelComplete, this);

        // Tap to launch ball
        input.on(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }

    onEnable(): void {
        // Fix lifecycle timing: when ScreenManager activates this panel,
        // the STATE_CHANGED event has already been dispatched. So we check
        // the current state here and start the level if needed.
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
        input.off(Input.EventType.TOUCH_START, this._onTouchStart, this);
    }

    // ─── Build HUD ──────────────────────────────────────
    private _buildHUD(): void {
        // Background
        const bg = new Node('GameBg');
        this.node.addChild(bg);
        const bgUt = bg.addComponent(UITransform);
        bgUt.setContentSize(new Size(960, 640));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(15, 15, 35, 255);
        bgGfx.rect(-480, -320, 960, 640);
        bgGfx.fill();

        // Score label
        const scoreNode = new Node('ScoreLabel');
        this.node.addChild(scoreNode);
        scoreNode.setPosition(-400, 300, 0);
        const scoreUt = scoreNode.addComponent(UITransform);
        scoreUt.setContentSize(new Size(200, 30));
        scoreUt.setAnchorPoint(0, 0.5);
        this._scoreLabel = scoreNode.addComponent(Label);
        this._scoreLabel.string = 'Score: 0';
        this._scoreLabel.fontSize = 22;
        this._scoreLabel.lineHeight = 26;
        this._scoreLabel.color = new Color(255, 255, 255, 255);
        this._scoreLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        // Lives label
        const livesNode = new Node('LivesLabel');
        this.node.addChild(livesNode);
        livesNode.setPosition(0, 300, 0);
        const livesUt = livesNode.addComponent(UITransform);
        livesUt.setContentSize(new Size(200, 30));
        this._livesLabel = livesNode.addComponent(Label);
        this._livesLabel.string = `Lives: ${GameConfig.MAX_LIVES}`;
        this._livesLabel.fontSize = 22;
        this._livesLabel.lineHeight = 26;
        this._livesLabel.color = new Color(255, 200, 200, 255);
        this._livesLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

        // Level label
        const levelNode = new Node('LevelLabel');
        this.node.addChild(levelNode);
        levelNode.setPosition(350, 300, 0);
        const levelUt = levelNode.addComponent(UITransform);
        levelUt.setContentSize(new Size(200, 30));
        this._levelLabel = levelNode.addComponent(Label);
        this._levelLabel.string = 'Level: 1';
        this._levelLabel.fontSize = 22;
        this._levelLabel.lineHeight = 26;
        this._levelLabel.color = new Color(200, 255, 200, 255);
        this._levelLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        levelUt.setAnchorPoint(1, 0.5);

        // Pause button
        const pauseBtn = new Node('PauseButton');
        this.node.addChild(pauseBtn);
        pauseBtn.setPosition(430, 300, 0);
        const pauseUt = pauseBtn.addComponent(UITransform);
        pauseUt.setContentSize(new Size(40, 30));
        const pauseGfx = pauseBtn.addComponent(Graphics);
        pauseGfx.fillColor = new Color(100, 100, 100, 200);
        pauseGfx.roundRect(-20, -15, 40, 30, 6);
        pauseGfx.fill();
        // Pause icon (two vertical bars)
        pauseGfx.fillColor = new Color(255, 255, 255, 255);
        pauseGfx.rect(-8, -8, 5, 16);
        pauseGfx.fill();
        pauseGfx.rect(3, -8, 5, 16);
        pauseGfx.fill();

        pauseBtn.on(Node.EventType.TOUCH_END, this._onPausePressed, this);
    }

    // ─── Build game container ───────────────────────────
    private _buildGameContainer(): void {
        this._gameContainer = new Node('GameContainer');
        this.node.addChild(this._gameContainer);

        // Walls (visual)
        this._drawWalls();

        // Paddle
        const paddleNode = new Node('Paddle');
        this._gameContainer.addChild(paddleNode);
        this._paddle = paddleNode.addComponent(Paddle);

        // Ball
        const ballNode = new Node('Ball');
        this._gameContainer.addChild(ballNode);
        this._ball = ballNode.addComponent(Ball);
        this._ball.paddleNode = paddleNode;

        // BrickManager
        const bmNode = new Node('BrickManager');
        this._gameContainer.addChild(bmNode);
        this._brickManager = bmNode.addComponent(BrickManager);

        // Listen for BRICK_HIT to forward to Brick component
        EventManager.on(GameEvents.BRICK_HIT, this._onBrickHit, this);
    }

    private _drawWalls(): void {
        const wallNode = new Node('Walls');
        this._gameContainer!.addChild(wallNode);
        const wallUt = wallNode.addComponent(UITransform);
        wallUt.setContentSize(new Size(960, 640));
        const gfx = wallNode.addComponent(Graphics);

        gfx.strokeColor = new Color(60, 60, 100, 255);
        gfx.lineWidth = 3;
        // Left wall
        gfx.moveTo(GameConfig.WALL_LEFT, GameConfig.WALL_BOTTOM);
        gfx.lineTo(GameConfig.WALL_LEFT, GameConfig.WALL_TOP);
        // Top wall
        gfx.lineTo(GameConfig.WALL_RIGHT, GameConfig.WALL_TOP);
        // Right wall
        gfx.lineTo(GameConfig.WALL_RIGHT, GameConfig.WALL_BOTTOM);
        gfx.stroke();
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

    // ─── Event handlers ─────────────────────────────────
    private _onStateChanged(state: GameState): void {
        if (state === GameState.Playing) {
            this.startLevel();
        }
    }

    private _onScoreChanged(score: number): void {
        if (this._scoreLabel) this._scoreLabel.string = `Score: ${score}`;
    }

    private _onLivesChanged(lives: number): void {
        if (this._livesLabel) this._livesLabel.string = `Lives: ${lives}`;
    }

    private _onBallLost(): void {
        const alive = GameManager.instance.loseLife();
        if (alive) {
            // Reset ball position, wait for tap
            this._ball?.resetBall();
        }
        // If not alive, GameManager changes state to GameOver
    }

    private _onLevelComplete(): void {
        // Small delay then next level
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
        if (this._scoreLabel) this._scoreLabel.string = `Score: ${gm.score}`;
        if (this._livesLabel) this._livesLabel.string = `Lives: ${gm.lives}`;
        if (this._levelLabel) this._levelLabel.string = `Level: ${gm.currentLevel + 1}`;
    }
}
