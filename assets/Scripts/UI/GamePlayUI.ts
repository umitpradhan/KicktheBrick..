import { _decorator, Component, Node, Label, input, Input, EventTouch, Graphics, Color, UITransform, tween, Vec3, UIOpacity, Widget } from 'cc';
import { GameConfig, GameEvents, GameState } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';
import { AudioManager } from '../Core/AudioManager';
import { ParticleManager } from '../Gameplay/ParticleManager';
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

    @property({ type: Label, tooltip: 'Combo Active Multiplier label' })
    public comboLabel: Label | null = null;
    
    @property({ type: Label, tooltip: 'Countdown Timer label' })
    public timerLabel: Label | null = null;

    @property({ type: Node, tooltip: 'Pause button node' })
    public pauseButton: Node | null = null;

    // ─── Gameplay nodes (wired in editor) ──────────────
    @property({ type: Node, tooltip: 'Container node for gameplay elements' })
    public gameContainer: Node | null = null;

    // Gameplay components (resolved at runtime)
    private _ball: Ball | null = null;
    private _paddle: Paddle | null = null;
    private _brickManager: BrickManager | null = null;
    
    // Combo Juice Trackers natively managing overlapping tweens safely
    private _lastMultiplier: number = 1.0;
    private _activeOpacityTween: any = null;
    private _activeComboTween: any = null;

    onLoad(): void {
        // Auto-resolve properties lost during hot-reload
        if (!this.scoreLabel) this.scoreLabel = this.node.getChildByName('ScoreLabel')?.getComponent(Label) || null;
        if (!this.livesLabel) this.livesLabel = this.node.getChildByName('LivesLabel')?.getComponent(Label) || null;
        if (!this.levelLabel) this.levelLabel = this.node.getChildByName('LevelLabel')?.getComponent(Label) || null;
        if (!this.pauseButton) this.pauseButton = this.node.getChildByName('PauseButton');
        if (!this.gameContainer) this.gameContainer = this.node.getChildByName('GameContainer');

        // Note: comboLabel and timerLabel are expected to be wired in the Editor natively.
        // Powerful Fallback: Guarantee Nodes exist dynamically if wires break!
        // if (!this.timerLabel) {
        //     let timerNode = this.node.getChildByName('TimerLabel') || new Node('TimerLabel');
        //     if (!timerNode.parent) this.node.addChild(timerNode);
        //     this.timerLabel = timerNode.getComponent(Label) || timerNode.addComponent(Label);
        //     this.timerLabel.string = '0:00';
        //     this.timerLabel.fontSize = 28;
        //     this.timerLabel.isBold = true;
        //     this.timerLabel.color = new Color(255, 255, 255);
        // }
        
        // if (!this.comboLabel) {
        //     let comboNode = this.node.getChildByName('ComboLabel') || new Node('ComboLabel');
        //     if (!comboNode.parent) this.node.addChild(comboNode);
        //     this.comboLabel = comboNode.getComponent(Label) || comboNode.addComponent(Label);
        //     this.comboLabel.string = 'Combo: x1.0';
        //     this.comboLabel.fontSize = 24;
        //     this.comboLabel.isBold = true;
        //     this.comboLabel.color = new Color(241, 196, 15);
        // }

        // Force native rendering indices guaranteeing elements never hide behind Backgrounds
        // this.timerLabel.node.parent = this.node;
        // this.comboLabel.node.parent = this.node;
        // this.timerLabel.node.setSiblingIndex(999);
        // this.comboLabel.node.setSiblingIndex(999);

        // Eradicate native Widget restraints completely stopping Editor Anchors from overwriting positions!
        // const timerWidget = this.timerLabel.node.getComponent(Widget);
        // if (timerWidget) timerWidget.destroy();
        
        // const comboWidget = this.comboLabel.node.getComponent(Widget);
        // if (comboWidget) comboWidget.destroy();

        // // Juice fallback bindings ensuring UIOpacity is attached natively
        // if (!this.comboLabel.node.getComponent(UIOpacity)) {
        //     const comboUIOp = this.comboLabel.node.addComponent(UIOpacity);
        //     comboUIOp.opacity = 0; // Hide by default until combo strikes natively
        // }

        // Resolve gameplay components dynamically tracing the entire Editor tree recursively!
        // This makes the physics bulletproof even if the Paddle/Ball/Bricks are dragged into new Folders!
        this._paddle = this.node.getComponentInChildren(Paddle);
        this._ball = this.node.getComponentInChildren(Ball);
        this._brickManager = this.node.getComponentInChildren(BrickManager);

        if (this._ball && this._paddle) {
            this._ball.paddleNode = this._paddle.node;
        }

        // Pause button handler
        if (this.pauseButton) {
            this.pauseButton.on(Node.EventType.TOUCH_END, this._onPausePressed, this);
        }

        // Event listeners
        EventManager.on(GameEvents.STATE_CHANGED, this._onStateChanged, this);
        EventManager.on(GameEvents.LEVEL_START, this.startLevel, this);
        EventManager.on(GameEvents.SCORE_CHANGED, this._onScoreChanged, this);
        EventManager.on(GameEvents.LIVES_CHANGED, this._onLivesChanged, this);
        EventManager.on(GameEvents.BALL_LOST, this._onBallLost, this);
        EventManager.on(GameEvents.LEVEL_COMPLETE, this._onLevelComplete, this);
        EventManager.on(GameEvents.BRICK_HIT, this._onBrickHit, this);
        EventManager.on(GameEvents.COMBO_CHANGED, this._onComboChanged, this);
        EventManager.on(GameEvents.POPUP_SCORE, this._onPopupScore, this);
        EventManager.on(GameEvents.TIMER_CHANGED, this._onTimerChanged, this);

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
    }

    onDestroy(): void {
        EventManager.off(GameEvents.STATE_CHANGED, this._onStateChanged, this);
        EventManager.off(GameEvents.LEVEL_START, this.startLevel, this);
        EventManager.off(GameEvents.SCORE_CHANGED, this._onScoreChanged, this);
        EventManager.off(GameEvents.LIVES_CHANGED, this._onLivesChanged, this);
        EventManager.off(GameEvents.BALL_LOST, this._onBallLost, this);
        EventManager.off(GameEvents.LEVEL_COMPLETE, this._onLevelComplete, this);
        EventManager.off(GameEvents.BRICK_HIT, this._onBrickHit, this);
        EventManager.off(GameEvents.COMBO_CHANGED, this._onComboChanged, this);
        EventManager.off(GameEvents.POPUP_SCORE, this._onPopupScore, this);
        EventManager.off(GameEvents.TIMER_CHANGED, this._onTimerChanged, this);
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
        // Resumes should not reset the level! Wait for LEVEL_START
    }

    private _onScoreChanged(score: number): void {
        if (this.scoreLabel) this.scoreLabel.string = `Score: ${score}`;
    }

    private _onLivesChanged(lives: number): void {
        if (this.livesLabel) this.livesLabel.string = `Lives: ${lives}`;
    }

    private _onTimerChanged(time: number): void {
        if (!this.timerLabel) return;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const secsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
        this.timerLabel.string = `${minutes}:${secsStr}`;
        
        // Dynamic Warning Visual limits
        if (time <= 10) {
            this.timerLabel.color = new Color(231, 76, 60); // Red Alert!
        } else {
            this.timerLabel.color = new Color(255, 255, 255);
        }
    }


    private _onComboChanged(multiplier: number): void {
        if (!this.comboLabel) return;
        const uiOp = this.comboLabel.node.getComponent(UIOpacity);
        if (!uiOp) return;
        
        this.comboLabel.enabled = true;
        // 1. Fully Stop Active Bounces AND Active Fades!
        if (this._activeComboTween) {
            this._activeComboTween.stop();
            this._activeComboTween = null;
        }
        if (this._activeOpacityTween) {
            this._activeOpacityTween.stop();
            this._activeOpacityTween = null;
        }
        // 2. Eradicate any background nesting bugs!
        this.comboLabel.node.setSiblingIndex(999);
        if (multiplier > 1.0) {
            this.comboLabel.string = `Combo: x${multiplier.toFixed(1)}`;
            this.comboLabel.color = new Color(241, 196, 15); // Gold
            uiOp.opacity = 255; // Snap back to totally visible instantly
            this.comboLabel.node.scale = new Vec3(1.5, 1.5, 1.5);
            
            if (AudioManager.instance) AudioManager.instance.playBrickShatter();
            if (ParticleManager.instance) ParticleManager.instance.spawnBurst(0, 480, new Color(241, 196, 15), 10);
            this._activeComboTween = tween(this.comboLabel.node)
                .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'bounceOut' })
                .delay(1.5)
                .call(() => { 
                    // 3. Track the Fade-Out animation so we can kill it early if another brick is hit!
                    this._activeOpacityTween = tween(uiOp).to(0.5, { opacity: 0 }).start(); 
                })
                .start();
                
        } else if (multiplier === 1.0 && this._lastMultiplier > 1.0) {
            this.comboLabel.string = `Combo Lost`;
            this.comboLabel.color = new Color(231, 76, 60); // Red
            uiOp.opacity = 255;
            this.comboLabel.node.scale = new Vec3(1.2, 1.2, 1.2);
            
            if (AudioManager.instance) AudioManager.instance.playPaddleBonk();
            if (ParticleManager.instance) ParticleManager.instance.spawnBurst(0, 480, new Color(231, 76, 60), 15);
            this._activeComboTween = tween(this.comboLabel.node)
                .to(0.3, { scale: new Vec3(1, 1, 1) })
                .delay(0.7)
                .call(() => { 
                    this._activeOpacityTween = tween(uiOp).to(0.5, { opacity: 0 }).start(); 
                })
                .start();
        } else {
            uiOp.opacity = 0;
        }
        this._lastMultiplier = multiplier;
    }

    private _onPopupScore(data: { position: Vec3, score: number, multiplier: number }): void {
        // ALWAYS generate a pristine new node. Bypassing Editor conflicts explicitly natively!
        const popupNode = new Node('ScorePopup');
        
        // Bind accurately to BrickContainer mapping exact physical offsets securely
        if (!this._brickManager || !this._brickManager.brickContainer) {
            if (!this.gameContainer) return;
            this.gameContainer.addChild(popupNode);
        } else {
            this._brickManager.brickContainer.addChild(popupNode);
        }

        popupNode.setPosition(data.position);
        
        const label = popupNode.addComponent(Label);
        
        if (data.multiplier > 1.0) {
            label.string = `+${data.score} (x${data.multiplier.toFixed(1)})`;
            label.color = new Color(241, 196, 15); // Hardcore Gold
            label.fontSize = 28;
            label.isBold = true;
        } else {
            label.string = `+${data.score}`;
            label.color = new Color(255, 255, 255); // Casual White
            label.fontSize = 22;
        }

        // Add drifting fade-out Juice animation cleanly executing opacity 0
        const uiOpacity = popupNode.addComponent(UIOpacity);
        uiOpacity.opacity = 255;
        tween(uiOpacity).to(1.2, { opacity: 0 }).start();

        const startPos = data.position;
        // Float 100 pixels into the air gracefully tracking target position
        const targetPos = new Vec3(startPos.x, startPos.y + 100, startPos.z);
        
        tween(popupNode)
            .to(1.2, { position: targetPos }, { easing: 'cubicOut' })
            .call(() => {
                popupNode.destroy();
            })
            .start();
    }

    private _onBallLost(): void {
        const alive = GameManager.instance.loseLife();
        if (alive) {
            this._ball?.resetBall();
        }
    }

    private _onLevelComplete(): void {
        this._showLevelClearedJuice();
        this.scheduleOnce(() => {
            GameManager.instance.nextLevel();
        }, 3.0);
    }
    
    private _showLevelClearedJuice(): void {
        if (!this.gameContainer) return;
        const bannerNode = new Node('LevelClearedBanner');
        this.gameContainer.addChild(bannerNode);
        bannerNode.setPosition(0, 150);

        const lbl = bannerNode.addComponent(Label);
        
        // Explicitly pre-evaluate milestones capturing active parameters sequentially
        GameManager.instance.evaluateLevelStars(); 
        const stars = GameManager.instance.earnedStars;

        let starsIcon = "";
        for (let s = 1; s <= 3; s++) {
            starsIcon += (s <= stars) ? "★" : "☆";
        }
        
        lbl.string = `LEVEL CLEARED!\n${starsIcon}`;
        lbl.fontSize = 54;
        lbl.isBold = true;
        lbl.color = new Color(241, 196, 15);
        lbl.horizontalAlign = Label.HorizontalAlign.CENTER;

        // Bounce Juice
        bannerNode.scale = new Vec3(0,0,0);
        tween(bannerNode)
            .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .delay(2.0)
            .to(0.3, { scale: new Vec3(0, 0, 0) }, { easing: 'backIn' })
            .call(() => bannerNode.destroy())
            .start();
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
        
        if (this.timerLabel) {
            const ceilTime = Math.ceil(gm.timeRemaining);
            const minutes = Math.floor(ceilTime / 60);
            const seconds = ceilTime % 60;
            const secsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
            this.timerLabel.string = `${minutes}:${secsStr}`;
            this.timerLabel.color = new Color(255, 255, 255);
        }
    }
}
