import { _decorator, Component, Node } from 'cc';
import { GameManager } from './Core/GameManager';
import { GameEvents } from './Core/Constants';
import { ScreenManager } from './UI/ScreenManager';
import { EventManager } from './Core/EventManager';

const { ccclass, property } = _decorator;

/**
 * AppRoot — entry-point component attached to Canvas in approot.scene.
 * Bootstraps all managers and registers the four UI panels defined in the editor.
 * This is the ONLY component that needs to be manually attached in the editor.
 */
@ccclass('AppRoot')
export class AppRoot extends Component {

    @property({ type: Node, tooltip: 'Main Menu panel node' })
    public mainMenuPanel: Node | null = null;

    @property({ type: Node, tooltip: 'Game Play panel node' })
    public gamePlayPanel: Node | null = null;

    @property({ type: Node, tooltip: 'Result screen panel node' })
    public resultPanel: Node | null = null;

    @property({ type: Node, tooltip: 'Pause overlay panel node' })
    public pausePanel: Node | null = null;

    private _screenManager: ScreenManager | null = null;

    start(): void {
        // Auto-resolve if properties were lost during editor hot-reload
        if (!this.mainMenuPanel) this.mainMenuPanel = this.node.getChildByName('MainMenuPanel');
        if (!this.gamePlayPanel) this.gamePlayPanel = this.node.getChildByName('GamePlayPanel');
        if (!this.resultPanel) this.resultPanel = this.node.getChildByName('ResultPanel');
        if (!this.pausePanel) this.pausePanel = this.node.getChildByName('PausePanel');

        // Initialize GameManager singleton
        const gm = GameManager.instance;

        // Create ScreenManager
        this._screenManager = new ScreenManager();

        // Register panels with ScreenManager
        if (this.mainMenuPanel) {
            this._screenManager.registerPanel(ScreenManager.MAIN_MENU, this.mainMenuPanel);
        }
        if (this.gamePlayPanel) {
            this._screenManager.registerPanel(ScreenManager.GAME_PLAY, this.gamePlayPanel);
        }
        if (this.resultPanel) {
            this._screenManager.registerPanel(ScreenManager.RESULT, this.resultPanel);
        }
        if (this.pausePanel) {
            this._screenManager.registerPanel(ScreenManager.PAUSE, this.pausePanel);
        }

        // Start on main menu
        this._screenManager.show(ScreenManager.MAIN_MENU);
    }

    update(dt: number): void {
        GameManager.instance.tickTimer(dt);
    }

    onDestroy(): void {
        this._screenManager?.destroy();
        EventManager.clear();
    }
}
