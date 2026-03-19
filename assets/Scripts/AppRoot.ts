import { _decorator, Component, Node, UITransform, Size } from 'cc';
import { GameManager } from './Core/GameManager';
import { GameState, GameEvents } from './Core/Constants';
import { ScreenManager } from './UI/ScreenManager';
import { MainMenuUI } from './UI/MainMenuUI';
import { GamePlayUI } from './UI/GamePlayUI';
import { PauseMenuUI } from './UI/PauseMenuUI';
import { ResultScreenUI } from './UI/ResultScreenUI';
import { EventManager } from './Core/EventManager';

const { ccclass } = _decorator;

/**
 * AppRoot — entry-point component attached to Canvas in approot.scene.
 * Bootstraps all managers and creates the four UI panels programmatically.
 * This is the ONLY component that needs to be manually attached in the editor.
 */
@ccclass('AppRoot')
export class AppRoot extends Component {

    private _screenManager: ScreenManager | null = null;

    start(): void {
        // Initialize GameManager singleton
        const gm = GameManager.instance;

        // Create ScreenManager
        this._screenManager = new ScreenManager();

        // Build panels
        const menuPanel = this._createPanel('MainMenuPanel');
        menuPanel.addComponent(MainMenuUI);

        const gamePanel = this._createPanel('GamePlayPanel');
        gamePanel.addComponent(GamePlayUI);

        const resultPanel = this._createPanel('ResultPanel');
        resultPanel.addComponent(ResultScreenUI);

        const pausePanel = this._createPanel('PausePanel');
        pausePanel.addComponent(PauseMenuUI);

        // Register panels with ScreenManager
        this._screenManager.registerPanel(ScreenManager.MAIN_MENU, menuPanel);
        this._screenManager.registerPanel(ScreenManager.GAME_PLAY, gamePanel);
        this._screenManager.registerPanel(ScreenManager.RESULT, resultPanel);
        this._screenManager.registerPanel(ScreenManager.PAUSE, pausePanel);

        // Start on main menu
        this._screenManager.show(ScreenManager.MAIN_MENU);
    }

    onDestroy(): void {
        this._screenManager?.destroy();
        EventManager.clear();
    }

    /**
     * Create a panel node with a full-size UITransform as a child of Canvas.
     */
    private _createPanel(name: string): Node {
        const panel = new Node(name);
        this.node.addChild(panel);

        const ut = panel.addComponent(UITransform);
        ut.setContentSize(new Size(960, 640));
        ut.setAnchorPoint(0.5, 0.5);

        panel.setPosition(0, 0, 0);
        panel.active = false; // Start inactive

        return panel;
    }
}
