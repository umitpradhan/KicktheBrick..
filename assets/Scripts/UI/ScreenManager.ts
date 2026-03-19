import { Node } from 'cc';
import { GameState, GameEvents } from '../Core/Constants';
import { EventManager } from '../Core/EventManager';

/**
 * ScreenManager — toggles panels (MainMenu / GamePlay / Result / Pause)
 * within the single approot scene based on GameState changes.
 */
export class ScreenManager {

    private _panels: Map<string, Node> = new Map();

    // Panel key constants
    public static readonly MAIN_MENU = 'MainMenu';
    public static readonly GAME_PLAY = 'GamePlay';
    public static readonly RESULT = 'Result';
    public static readonly PAUSE = 'Pause';

    constructor() {
        EventManager.on(GameEvents.STATE_CHANGED, this._onStateChanged, this);
    }

    /** Register a panel node by key. */
    public registerPanel(key: string, node: Node): void {
        this._panels.set(key, node);
    }

    /** Show only the specified panel(s), hide all others. */
    public show(key: string): void {
        this._panels.forEach((node, k) => {
            node.active = (k === key);
        });
    }

    /** Show a panel without hiding others (for overlays like Pause). */
    public showOverlay(key: string, visible: boolean): void {
        const node = this._panels.get(key);
        if (node) node.active = visible;
    }

    private _onStateChanged(state: GameState): void {
        switch (state) {
            case GameState.Menu:
                this.show(ScreenManager.MAIN_MENU);
                break;
            case GameState.Playing:
                this.show(ScreenManager.GAME_PLAY);
                this.showOverlay(ScreenManager.PAUSE, false);
                break;
            case GameState.Paused:
                // Keep gameplay visible, show pause overlay on top
                this.showOverlay(ScreenManager.PAUSE, true);
                break;
            case GameState.GameOver:
            case GameState.GameWon:
                this.show(ScreenManager.RESULT);
                break;
        }
    }

    public destroy(): void {
        EventManager.off(GameEvents.STATE_CHANGED, this._onStateChanged, this);
    }
}
