import { _decorator, Component, Node, Label } from 'cc';
import { GameState, GameEvents } from '../Core/Constants';
import { GameManager } from '../Core/GameManager';
import { NativeBridge } from '../Native/NativeBridge';

const { ccclass, property } = _decorator;

/**
 * ResultScreenUI — shows final score, copy-to-clipboard button, and play-again.
 * UI elements are defined in the scene editor and wired via @property.
 */
@ccclass('ResultScreenUI')
export class ResultScreenUI extends Component {

    @property({ type: Label, tooltip: 'Title label (GAME OVER / YOU WIN)' })
    public titleLabel: Label | null = null;

    @property({ type: Label, tooltip: 'Final score display label' })
    public scoreLabel: Label | null = null;

    @property({ type: Label, tooltip: 'Copy feedback label' })
    public copyFeedback: Label | null = null;

    @property({ type: Node, tooltip: 'Copy score button node' })
    public copyButton: Node | null = null;

    @property({ type: Node, tooltip: 'Play Again button node' })
    public playAgainButton: Node | null = null;

    @property({ type: Node, tooltip: 'Main Menu button node' })
    public mainMenuButton: Node | null = null;

    onLoad(): void {
        // Auto-resolve properties
        if (!this.titleLabel) this.titleLabel = this.node.getChildByName('ResultTitle')?.getComponent(Label) || null;
        if (!this.scoreLabel) this.scoreLabel = this.node.getChildByName('FinalScore')?.getComponent(Label) || null;
        if (!this.copyFeedback) this.copyFeedback = this.node.getChildByName('CopyFeedback')?.getComponent(Label) || null;
        if (!this.copyButton) this.copyButton = this.node.getChildByName('CopyButton');
        if (!this.playAgainButton) this.playAgainButton = this.node.getChildByName('PlayAgainButton');
        if (!this.mainMenuButton) this.mainMenuButton = this.node.getChildByName('MainMenuButton');

        if (this.copyButton) {
            this.copyButton.on(Node.EventType.TOUCH_END, this._onCopyPressed, this);
        }
        if (this.playAgainButton) {
            this.playAgainButton.on(Node.EventType.TOUCH_END, this._onPlayAgain, this);
        }
        if (this.mainMenuButton) {
            this.mainMenuButton.on(Node.EventType.TOUCH_END, this._onMainMenu, this);
        }
    }

    onEnable(): void {
        this._updateDisplay();
    }

    onDestroy(): void {
        if (this.copyButton) {
            this.copyButton.off(Node.EventType.TOUCH_END, this._onCopyPressed, this);
        }
        if (this.playAgainButton) {
            this.playAgainButton.off(Node.EventType.TOUCH_END, this._onPlayAgain, this);
        }
        if (this.mainMenuButton) {
            this.mainMenuButton.off(Node.EventType.TOUCH_END, this._onMainMenu, this);
        }
    }

    private _updateDisplay(): void {
        const gm = GameManager.instance;
        if (this.scoreLabel) {
            this.scoreLabel.string = `Final Score: ${gm.score}`;
        }
        if (this.titleLabel) {
            if (gm.state === GameState.GameWon) {
                this.titleLabel.string = 'YOU WIN!';
                this.titleLabel.color.set(76, 175, 80, 255);
            } else {
                this.titleLabel.string = 'GAME OVER';
                this.titleLabel.color.set(239, 83, 80, 255);
            }
        }
        if (this.copyFeedback) {
            this.copyFeedback.string = '';
        }
    }

    private _onCopyPressed(): void {
        const scoreText = `Brick Breaker Score: ${GameManager.instance.score}`;
        NativeBridge.copyToClipboard(scoreText);
        if (this.copyFeedback) {
            this.copyFeedback.string = '✓ Score copied to clipboard!';
        }
    }

    private _onPlayAgain(): void {
        GameManager.instance.startGame();
    }

    private _onMainMenu(): void {
        GameManager.instance.resetGame();
    }
}
