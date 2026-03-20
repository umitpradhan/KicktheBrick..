import { _decorator, Component, Node, Label, UITransform, Graphics, Color,
    Size } from 'cc';
import { GameState, GameEvents } from '../Core/Constants';
import { GameManager } from '../Core/GameManager';
import { NativeBridge } from '../Native/NativeBridge';

const { ccclass } = _decorator;

/**
 * ResultScreenUI — shows final score, copy-to-clipboard button, and play-again.
 */
@ccclass('ResultScreenUI')
export class ResultScreenUI extends Component {

    private _scoreLabel: Label | null = null;
    private _titleLabel: Label | null = null;
    private _copyFeedback: Label | null = null;

    onLoad(): void {
        this._buildUI();
    }

    onEnable(): void {
        // Update score and title when panel becomes visible
        this._updateDisplay();
    }

    private _buildUI(): void {
        // ─── Background ─────────────────────────────────
        const bg = new Node('ResultBg');
        this.node.addChild(bg);
        const bgUt = bg.addComponent(UITransform);
        bgUt.setContentSize(new Size(720, 1280));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(20, 20, 40, 255);
        bgGfx.rect(-360, -640, 720, 1280);
        bgGfx.fill();

        // ─── Title (Game Over / You Win) ────────────────
        const titleNode = new Node('ResultTitle');
        this.node.addChild(titleNode);
        titleNode.setPosition(0, 250, 0);
        const titleUt = titleNode.addComponent(UITransform);
        titleUt.setContentSize(new Size(400, 50));
        this._titleLabel = titleNode.addComponent(Label);
        this._titleLabel.string = 'GAME OVER';
        this._titleLabel.fontSize = 44;
        this._titleLabel.lineHeight = 48;
        this._titleLabel.color = new Color(239, 83, 80, 255);
        this._titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this._titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this._titleLabel.isBold = true;

        // ─── Score display ──────────────────────────────
        const scoreNode = new Node('FinalScore');
        this.node.addChild(scoreNode);
        scoreNode.setPosition(0, 140, 0);
        const scoreUt = scoreNode.addComponent(UITransform);
        scoreUt.setContentSize(new Size(400, 40));
        this._scoreLabel = scoreNode.addComponent(Label);
        this._scoreLabel.string = 'Final Score: 0';
        this._scoreLabel.fontSize = 32;
        this._scoreLabel.lineHeight = 36;
        this._scoreLabel.color = new Color(255, 255, 255, 255);
        this._scoreLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this._scoreLabel.verticalAlign = Label.VerticalAlign.CENTER;

        // ─── Copy Score button ──────────────────────────
        const copyBtn = new Node('CopyButton');
        this.node.addChild(copyBtn);
        copyBtn.setPosition(0, 30, 0);
        const copyUt = copyBtn.addComponent(UITransform);
        copyUt.setContentSize(new Size(240, 48));
        const copyGfx = copyBtn.addComponent(Graphics);
        copyGfx.fillColor = new Color(33, 150, 243, 255); // blue
        copyGfx.roundRect(-120, -24, 240, 48, 10);
        copyGfx.fill();

        const copyLabel = new Node('CopyLabel');
        copyBtn.addChild(copyLabel);
        const clUt = copyLabel.addComponent(UITransform);
        clUt.setContentSize(new Size(240, 48));
        const cl = copyLabel.addComponent(Label);
        cl.string = '📋 COPY SCORE';
        cl.fontSize = 20;
        cl.lineHeight = 48;
        cl.color = new Color(255, 255, 255, 255);
        cl.horizontalAlign = Label.HorizontalAlign.CENTER;
        cl.verticalAlign = Label.VerticalAlign.CENTER;
        cl.isBold = true;

        copyBtn.on(Node.EventType.TOUCH_END, this._onCopyPressed, this);

        // ─── Copy feedback label ────────────────────────
        const feedbackNode = new Node('CopyFeedback');
        this.node.addChild(feedbackNode);
        feedbackNode.setPosition(0, -25, 0);
        const fbUt = feedbackNode.addComponent(UITransform);
        fbUt.setContentSize(new Size(300, 24));
        this._copyFeedback = feedbackNode.addComponent(Label);
        this._copyFeedback.string = '';
        this._copyFeedback.fontSize = 16;
        this._copyFeedback.lineHeight = 20;
        this._copyFeedback.color = new Color(76, 175, 80, 255);
        this._copyFeedback.horizontalAlign = Label.HorizontalAlign.CENTER;

        // ─── Play Again button ──────────────────────────
        const playBtn = new Node('PlayAgainButton');
        this.node.addChild(playBtn);
        playBtn.setPosition(0, -100, 0);
        const playUt = playBtn.addComponent(UITransform);
        playUt.setContentSize(new Size(200, 48));
        const playGfx = playBtn.addComponent(Graphics);
        playGfx.fillColor = new Color(76, 175, 80, 255); // green
        playGfx.roundRect(-100, -24, 200, 48, 10);
        playGfx.fill();

        const playLabel = new Node('PlayLabel');
        playBtn.addChild(playLabel);
        const plUt = playLabel.addComponent(UITransform);
        plUt.setContentSize(new Size(200, 48));
        const pl = playLabel.addComponent(Label);
        pl.string = 'PLAY AGAIN';
        pl.fontSize = 20;
        pl.lineHeight = 48;
        pl.color = new Color(255, 255, 255, 255);
        pl.horizontalAlign = Label.HorizontalAlign.CENTER;
        pl.verticalAlign = Label.VerticalAlign.CENTER;
        pl.isBold = true;

        playBtn.on(Node.EventType.TOUCH_END, this._onPlayAgain, this);

        // ─── Main Menu button ───────────────────────────
        const menuBtn = new Node('MainMenuButton');
        this.node.addChild(menuBtn);
        menuBtn.setPosition(0, -180, 0);
        const menuUt = menuBtn.addComponent(UITransform);
        menuUt.setContentSize(new Size(200, 48));
        const menuGfx = menuBtn.addComponent(Graphics);
        menuGfx.fillColor = new Color(100, 100, 100, 255); // gray
        menuGfx.roundRect(-100, -24, 200, 48, 10);
        menuGfx.fill();

        const menuLabel = new Node('MenuLabel');
        menuBtn.addChild(menuLabel);
        const mlUt = menuLabel.addComponent(UITransform);
        mlUt.setContentSize(new Size(200, 48));
        const ml = menuLabel.addComponent(Label);
        ml.string = 'MAIN MENU';
        ml.fontSize = 20;
        ml.lineHeight = 48;
        ml.color = new Color(255, 255, 255, 255);
        ml.horizontalAlign = Label.HorizontalAlign.CENTER;
        ml.verticalAlign = Label.VerticalAlign.CENTER;
        ml.isBold = true;

        menuBtn.on(Node.EventType.TOUCH_END, this._onMainMenu, this);
    }

    private _updateDisplay(): void {
        const gm = GameManager.instance;
        if (this._scoreLabel) {
            this._scoreLabel.string = `Final Score: ${gm.score}`;
        }
        if (this._titleLabel) {
            if (gm.state === GameState.GameWon) {
                this._titleLabel.string = 'YOU WIN!';
                this._titleLabel.color = new Color(76, 175, 80, 255);
            } else {
                this._titleLabel.string = 'GAME OVER';
                this._titleLabel.color = new Color(239, 83, 80, 255);
            }
        }
        if (this._copyFeedback) {
            this._copyFeedback.string = '';
        }
    }

    private _onCopyPressed(): void {
        const scoreText = `Brick Breaker Score: ${GameManager.instance.score}`;
        NativeBridge.copyToClipboard(scoreText);
        if (this._copyFeedback) {
            this._copyFeedback.string = '✓ Score copied to clipboard!';
        }
    }

    private _onPlayAgain(): void {
        GameManager.instance.startGame();
    }

    private _onMainMenu(): void {
        GameManager.instance.resetGame();
    }
}
