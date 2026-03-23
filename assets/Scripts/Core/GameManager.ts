import { _decorator, Component, Node, director, Prefab, instantiate } from 'cc';
import { GameState, GameEvents, GameConfig, BrickType } from './Constants';
import { UserData } from '../Data/UserData';
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
    private _comboMultiplier: number = 1.0;
    private _timeRemaining: number = 0;
    private _earnedStars: number = 0;

    // ─── Getters ────────────────────────────────────────────
    public get state(): GameState { return this._state; }
    public get score(): number { return this._score; }
    public get lives(): number { return this._lives; }
    public get currentLevel(): number { return this._currentLevel; }
    public get totalLevels(): number { return LevelConfigs.length; }
    public get comboMultiplier(): number { return this._comboMultiplier; }
    public get timeRemaining(): number { return this._timeRemaining; }
    public get earnedStars(): number { return this._earnedStars; }

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
        this._comboMultiplier = 1.0;
        this.setState(GameState.Menu);
    }

    /** Start a new game gracefully configuring active skin powerups */
    public startGame(): void {
        this._score = 0;
        
        let initialLives = GameConfig.MAX_LIVES;
        
        // Powerup Override: Crimson Red (+1 Life)
        if (UserData.instance.equippedPaddleId === 2) {
            initialLives += 1;
        }
        
        this._lives = initialLives;
        // Do NOT reset _currentLevel here, so loadSpecificLevel works!
        this._comboMultiplier = 1.0;
        this._timeRemaining = LevelConfigs[this._currentLevel]?.targetTime || 120;
        this._earnedStars = 0;
        
        this.setState(GameState.Playing);
        EventManager.emit(GameEvents.LEVEL_START);
        EventManager.emit(GameEvents.SCORE_CHANGED, this._score);
        EventManager.emit(GameEvents.LIVES_CHANGED, this._lives);
        EventManager.emit(GameEvents.COMBO_CHANGED, this._comboMultiplier);
    }

    /** Public hook safely loading explicit levels natively supporting Dashboard Selection */
    public loadSpecificLevel(levelIndex: number): void {
        this._currentLevel = levelIndex;
        this.startGame();
    }

    /** 
     * Native evaluation pipeline executing Star configurations strictly 
     * Validates thresholds against current configuration bindings automatically
     */
    public evaluateLevelStars(): void {
        const config = LevelConfigs[this._currentLevel];
        let stars = 0;
        
        // Validation Criteria
        if (this._lives > 0) stars++; // Earned naturally by winning
        if (this._timeRemaining > 0) stars++; // Unbroken Time threshold
        if (this._score >= config.targetScore) stars++; // Score threshold 

        this._earnedStars = stars;
        UserData.instance.saveLevelStars(this._currentLevel, stars);
    }

    /** Advance to the next level legally, or win if all levels done. */
    public nextLevel(): void {
        this.evaluateLevelStars();
        this._currentLevel++;
        if (this._currentLevel >= LevelConfigs.length) {
            // All levels complete → game won
            this.setState(GameState.GameWon);
        } else {
            this.setState(GameState.Playing);
            EventManager.emit(GameEvents.LEVEL_START);
        }
    }

    /** Formally ticks logic bounds validating literal 0 bounds seamlessly */
    public tickTimer(dt: number): void {
        if (this._state !== GameState.Playing) return;
        if (this._timeRemaining > 0) {
            this._timeRemaining -= dt;
            if (this._timeRemaining < 0) this._timeRemaining = 0;
            // Native Event ping (could stringify safely but generic events reduce load)
            EventManager.emit('TIMER_CHANGED', Math.ceil(this._timeRemaining));
        }
    }

    // ─── Combo System ───────────────────────────────────────
    public increaseCombo(): void {
        this._comboMultiplier = parseFloat((this._comboMultiplier + 0.1).toFixed(1));
        EventManager.emit(GameEvents.COMBO_CHANGED, this._comboMultiplier);
    }

    public resetCombo(): void {
        if (this._comboMultiplier > 1.0) {
            this._comboMultiplier = 1.0;
            EventManager.emit(GameEvents.COMBO_CHANGED, this._comboMultiplier);
        }
    }

    /** Add score parsing active Gold Multipliers + Combos notifying persistent records + wallet. */
    public addScore(points: number): void {
        let earned = this.evaluateScore(points);

        this._score += earned;
        UserData.instance.addCoins(earned); // Virtual Economy Deposit
        UserData.instance.updateHighScore(this._score); // Sync Meta Milestone
        EventManager.emit(GameEvents.SCORE_CHANGED, this._score);
    }

    /** Expose strict logic calculating precise active multipliers natively */
    public evaluateScore(points: number): number {
        // Base Points * Combo Multiplier
        let earned = Math.floor(points * this._comboMultiplier);
        
        // Powerup Override: Royal Gold (2x Multiplier on total)
        if (UserData.instance.equippedPaddleId === 3) {
            earned *= 2;
        }
        return earned;
    }

    /** Lose a life. Returns true if still alive. */
    public loseLife(): boolean {
        this._lives--;
        this.resetCombo();
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
