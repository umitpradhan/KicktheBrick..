import { _decorator, Component, Node, director } from 'cc';
import { GameState, GameEvents } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';
import { GameManager } from '../Core/GameManager';

const { ccclass, property } = _decorator;

/**
 * PauseMenuUI — semi-transparent overlay with Resume, Restart, and Quit buttons.
 * UI elements are defined in the scene editor and wired via @property.
 */
@ccclass('PauseMenuUI')
export class PauseMenuUI extends Component {

    @property({ type: Node, tooltip: 'Resume button node' })
    public resumeButton: Node | null = null;

    @property({ type: Node, tooltip: 'Restart button node' })
    public restartButton: Node | null = null;

    @property({ type: Node, tooltip: 'Quit button node' })
    public quitButton: Node | null = null;

    @property({ type: Node, tooltip: 'Overlay node to block touches' })
    public overlay: Node | null = null;

    private _isPaused: boolean = false;

    onLoad(): void {
        // Auto-resolve properties
        if (!this.overlay) this.overlay = this.node.getChildByName('PauseOverlay');
        const dialog = this.node.getChildByName('PauseDialogPanel');
        if (dialog) {
            if (!this.resumeButton) this.resumeButton = dialog.getChildByName('ResumeBtn');
            if (!this.restartButton) this.restartButton = dialog.getChildByName('RestartBtn');
            if (!this.quitButton) this.quitButton = dialog.getChildByName('QuitBtn');
        }

        // Bind button handlers
        if (this.resumeButton) {
            this.resumeButton.on(Node.EventType.TOUCH_END, this._onResume, this);
        }
        if (this.restartButton) {
            this.restartButton.on(Node.EventType.TOUCH_END, this._onRestart, this);
        }
        if (this.quitButton) {
            this.quitButton.on(Node.EventType.TOUCH_END, this._onQuit, this);
        }
        if (this.overlay) {
            this.overlay.on(Node.EventType.TOUCH_START, (e: any) => { e.propagationStopped = true; });
        }

        EventManager.on(GameEvents.STATE_CHANGED, this._onStateChanged, this);
    }

    onDestroy(): void {
        EventManager.off(GameEvents.STATE_CHANGED, this._onStateChanged, this);
        if (this.resumeButton) {
            this.resumeButton.off(Node.EventType.TOUCH_END, this._onResume, this);
        }
        if (this.restartButton) {
            this.restartButton.off(Node.EventType.TOUCH_END, this._onRestart, this);
        }
        if (this.quitButton) {
            this.quitButton.off(Node.EventType.TOUCH_END, this._onQuit, this);
        }
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
