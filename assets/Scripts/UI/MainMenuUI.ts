import { _decorator, Component, Node, Label } from 'cc';
import { GameManager } from '../Core/GameManager';

const { ccclass, property } = _decorator;

/**
 * MainMenuUI — Title + Play button.
 * UI elements are defined in the scene editor and wired via @property.
 */
@ccclass('MainMenuUI')
export class MainMenuUI extends Component {

    @property({ type: Node, tooltip: 'Play button node' })
    public playButton: Node | null = null;

    onLoad(): void {
        if (!this.playButton) this.playButton = this.node.getChildByName('PlayButton');

        // Bind touch handler on the play button
        if (this.playButton) {
            this.playButton.on(Node.EventType.TOUCH_END, this._onPlayPressed, this);
        }
    }

    onDestroy(): void {
        if (this.playButton) {
            this.playButton.off(Node.EventType.TOUCH_END, this._onPlayPressed, this);
        }
    }

    private _onPlayPressed(): void {
        GameManager.instance.startGame();
    }
}
