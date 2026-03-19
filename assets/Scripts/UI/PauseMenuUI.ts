import { _decorator, Component, Node, Label, UITransform, Graphics, Color,
    Size, director } from 'cc';
import { GameState, GameEvents } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';

const { ccclass } = _decorator;

/**
 * PauseMenuUI — semi-transparent overlay with Resume, Restart, and Quit buttons.
 * Pauses/resumes the game director.
 */
@ccclass('PauseMenuUI')
export class PauseMenuUI extends Component {

    private _isPaused: boolean = false;

    onLoad(): void {
        this._buildUI();
        EventManager.on(GameEvents.STATE_CHANGED, this._onStateChanged, this);
    }

    onDestroy(): void {
        EventManager.off(GameEvents.STATE_CHANGED, this._onStateChanged, this);
    }

    private _buildUI(): void {
        // ─── Dim overlay ────────────────────────────────
        const overlay = new Node('PauseOverlay');
        this.node.addChild(overlay);
        const olUt = overlay.addComponent(UITransform);
        olUt.setContentSize(new Size(960, 640));
        const olGfx = overlay.addComponent(Graphics);
        olGfx.fillColor = new Color(0, 0, 0, 150);
        olGfx.rect(-480, -320, 960, 640);
        olGfx.fill();
        // Block touches on overlay
        overlay.on(Node.EventType.TOUCH_START, (e: any) => { e.propagationStopped = true; });

        // ─── Panel ──────────────────────────────────────
        const panel = new Node('PausePanel');
        this.node.addChild(panel);
        const panelUt = panel.addComponent(UITransform);
        panelUt.setContentSize(new Size(280, 280));
        const panelGfx = panel.addComponent(Graphics);
        panelGfx.fillColor = new Color(40, 40, 70, 240);
        panelGfx.roundRect(-140, -140, 280, 280, 16);
        panelGfx.fill();
        panelGfx.strokeColor = new Color(79, 195, 247, 150);
        panelGfx.lineWidth = 2;
        panelGfx.roundRect(-140, -140, 280, 280, 16);
        panelGfx.stroke();

        // ─── Title ──────────────────────────────────────
        const title = new Node('PauseTitle');
        panel.addChild(title);
        title.setPosition(0, 100, 0);
        const titleUt = title.addComponent(UITransform);
        titleUt.setContentSize(new Size(260, 40));
        const titleLabel = title.addComponent(Label);
        titleLabel.string = 'PAUSED';
        titleLabel.fontSize = 32;
        titleLabel.lineHeight = 36;
        titleLabel.color = new Color(255, 255, 255, 255);
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        titleLabel.isBold = true;

        // ─── Resume button ──────────────────────────────
        this._createButton(panel, 'ResumeBtn', 0, 30, 'RESUME',
            new Color(76, 175, 80, 255), this._onResume);

        // ─── Restart button ─────────────────────────────
        this._createButton(panel, 'RestartBtn', 0, -35, 'RESTART',
            new Color(255, 152, 0, 255), this._onRestart);

        // ─── Quit button ────────────────────────────────
        this._createButton(panel, 'QuitBtn', 0, -100, 'QUIT',
            new Color(244, 67, 54, 255), this._onQuit);
    }

    private _createButton(parent: Node, name: string, x: number, y: number,
        text: string, color: Color, handler: () => void): void {
        const btn = new Node(name);
        parent.addChild(btn);
        btn.setPosition(x, y, 0);
        const btnUt = btn.addComponent(UITransform);
        btnUt.setContentSize(new Size(180, 44));
        const btnGfx = btn.addComponent(Graphics);
        btnGfx.fillColor = color;
        btnGfx.roundRect(-90, -22, 180, 44, 10);
        btnGfx.fill();

        const label = new Node('Label');
        btn.addChild(label);
        const lUt = label.addComponent(UITransform);
        lUt.setContentSize(new Size(180, 44));
        const l = label.addComponent(Label);
        l.string = text;
        l.fontSize = 20;
        l.lineHeight = 44;
        l.color = new Color(255, 255, 255, 255);
        l.horizontalAlign = Label.HorizontalAlign.CENTER;
        l.verticalAlign = Label.VerticalAlign.CENTER;
        l.isBold = true;

        btn.on(Node.EventType.TOUCH_END, handler, this);
    }

    private _onStateChanged(state: GameState): void {
        if (state === GameState.Paused && !this._isPaused) {
            this._isPaused = true;
            director.pause();
        } else if (state === GameState.Playing && this._isPaused) {
            this._isPaused = false;
            director.resume();
        }
    }

    private _onResume(): void {
        // Must resume director BEFORE changing state
        // because state change triggers event which needs director running
        director.resume();
        this._isPaused = false;
        GameManager.instance.togglePause();
    }

    private _onRestart(): void {
        director.resume();
        this._isPaused = false;
        GameManager.instance.startGame();
    }

    private _onQuit(): void {
        director.resume();
        this._isPaused = false;
        GameManager.instance.resetGame();
    }
}
