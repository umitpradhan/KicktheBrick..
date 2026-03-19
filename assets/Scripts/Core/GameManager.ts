import { _decorator, Component, Node, director, game } from 'cc';
import { GameState, GameConfig, GameEvents } from './Constants';
import { EventManager } from './EventManager';
import { LevelConfigs } from '../Data/LevelConfigs';

const { ccclass } = _decorator;

/**
 * GameManager — singleton that owns game state (score, lives, level, state).
 * Persists across the single-scene lifetime. Drives ScreenManager transitions.
 */
@ccclass('GameManager')
export class GameManager {

    // ─── Singleton ──────────────────────────────────────────
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }

    // ─── State ──────────────────────────────────────────────
    private _state: GameState = GameState.Menu;
    private _score: number = 0;
    private _lives: number = GameConfig.MAX_LIVES;
    private _currentLevel: number = 0; // 0-indexed

    // ─── Getters ────────────────────────────────────────────
    public get state(): GameState { return this._state; }
    public get score(): number { return this._score; }
    public get lives(): number { return this._lives; }
    public get currentLevel(): number { return this._currentLevel; }
    public get totalLevels(): number { return LevelConfigs.length; }

    // ─── State Transitions ──────────────────────────────────
    public setState(newState: GameState): void {
        this._state = newState;
        EventManager.emit(GameEvents.STATE_CHANGED, newState);
    }

    /** Reset everything and go to menu. */
    public resetGame(): void {
        this._score = 0;
        this._lives = GameConfig.MAX_LIVES;
        this._currentLevel = 0;
        this.setState(GameState.Menu);
    }

    /** Start a new game from level 1. */
    public startGame(): void {
        this._score = 0;
        this._lives = GameConfig.MAX_LIVES;
        this._currentLevel = 0;
        this.setState(GameState.Playing);
    }

    /** Advance to the next level, or win if all levels done. */
    public nextLevel(): void {
        this._currentLevel++;
        if (this._currentLevel >= LevelConfigs.length) {
            // All levels complete → game won
            this.setState(GameState.GameWon);
        } else {
            this.setState(GameState.Playing);
        }
    }

    /** Add score and notify listeners. */
    public addScore(points: number): void {
        this._score += points;
        EventManager.emit(GameEvents.SCORE_CHANGED, this._score);
    }

    /** Lose a life. Returns true if still alive. */
    public loseLife(): boolean {
        this._lives--;
        EventManager.emit(GameEvents.LIVES_CHANGED, this._lives);
        if (this._lives <= 0) {
            this.setState(GameState.GameOver);
            return false;
        }
        return true;
    }

    /** Pause / unpause toggle. */
    public togglePause(): void {
        if (this._state === GameState.Playing) {
            this.setState(GameState.Paused);
        } else if (this._state === GameState.Paused) {
            this.setState(GameState.Playing);
        }
    }
}
