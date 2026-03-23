import { _decorator, sys } from 'cc';
import { PaddleTiers } from '../Core/Constants';

const STORAGE_KEY = 'BrickGame_SaveData_v3'; // Bumped version structurally for Hybrid array

export interface SaveData {
    totalCoins: number;
    unlockedPaddleIds: number[];
    equippedPaddleId: number;
    highScore: number;
    levelsWon: number;
    levelStars: { [levelIndex: number]: number };
}

/**
 * UserData — Manages persistent storage natively via the core sys.localStorage mechanism.
 * Implements Singleton paradigm protecting the parse/stringify operations reliably.
 * Fully hybrid approach simultaneously navigating logic thresholds and economic metrics.
 */
export class UserData {
    private static _instance: UserData;

    private _data: SaveData = {
        totalCoins: 0,
        unlockedPaddleIds: [0], // Classic Blue implicitly owned natively
        equippedPaddleId: 0,
        highScore: 0,
        levelsWon: 0,
        levelStars: {}
    };

    /** Guarantee single access pipeline avoiding IO conflicts */
    public static get instance(): UserData {
        if (!this._instance) {
            this._instance = new UserData();
            this._instance.load();
        }
        return this._instance;
    }

    public get totalCoins(): number { return this._data.totalCoins; }
    public get unlockedPaddleIds(): number[] { return this._data.unlockedPaddleIds; }
    public get equippedPaddleId(): number { return this._data.equippedPaddleId; }
    public get highScore(): number { return this._data.highScore; }
    public get levelsWon(): number { return this._data.levelsWon; }
    
    public get levelStars(): { [levelIndex: number]: number } { return this._data.levelStars; }
    
    /** Get Highest Level Unlocked natively checking dictionary bindings safely */
    public get highestUnlockedLevel(): number {
        const playedLevels = Object.keys(this._data.levelStars).map(k => parseInt(k));
        if (playedLevels.length === 0) return 0; // Level 0 (Level 1 visually) is always unlocked
        return Math.max(...playedLevels) + 1; // Unlocks the next contiguous level natively
    }

    /** Load Hybrid arrays synchronously via JSON parsing algorithms natively */
    public load(): void {
        const savedString = sys.localStorage.getItem(STORAGE_KEY);
        if (savedString) {
            try {
                const parsed = JSON.parse(savedString);
                this._data.totalCoins = parsed.totalCoins ?? 0;
                this._data.unlockedPaddleIds = parsed.unlockedPaddleIds ?? [0];
                this._data.equippedPaddleId = parsed.equippedPaddleId ?? 0;
                this._data.highScore = parsed.highScore ?? 0;
                this._data.levelsWon = parsed.levelsWon ?? 0;
                this._data.levelStars = parsed.levelStars ?? {};
            } catch (e) {
                console.warn('UserData: JSON sequence corrupted, falling back to defaults.');
            }
        }
    }

    /** Write serialization directly mapping to the device native constraints reliably */
    public save(): void {
        sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(this._data));
    }

    /** Core Economy: Deposit real-world points straight into virtual logic array limits */
    public addCoins(amount: number): void {
        this._data.totalCoins += amount;
        this.save();
    }

    /** Checks exact subtraction logic successfully against real coin values */
    public spendCoins(amount: number): boolean {
        if (this._data.totalCoins >= amount) {
            this._data.totalCoins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    /** Milestones: Record total procedurally completed level array wins unconditionally */
    public incrementLevelsWon(): void {
        this._data.levelsWon++;
        this.save();
    }
    
    /** Safely log Level completions avoiding overwriting 3-Star records natively. Returns true if stars improved. */
    public saveLevelStars(levelIdx: number, stars: number): boolean {
        let improved = false;
        const currentStars = this._data.levelStars[levelIdx] || 0;
        
        // Log minimum 0 tracking generic clearance dynamically
        if (this._data.levelStars[levelIdx] === undefined) {
             this._data.levelStars[levelIdx] = 0;
        }

        if (stars > currentStars) {
            this._data.levelStars[levelIdx] = stars;
            improved = true;
            this.save();
        } else if (stars === 0) {
            this.save(); // ensure literal index save
        }
        return improved;
    }

    /** Milestones: Write overriding algorithm validating absolute highest gameplay records dynamically */
    public updateHighScore(score: number): void {
        if (score > this._data.highScore) {
            this._data.highScore = score;
            this.save();
        }
    }

    /** Verify literal mathematical ownership condition independent of achievements explicitly */
    public isUnlocked(id: number): boolean {
        return this._data.unlockedPaddleIds.indexOf(id) !== -1;
    }

    /** Validate logic threshold matrices against exact sequential achievement configurations conditionally */
    public isAchievementMet(id: number): boolean {
        const requisite = PaddleTiers.find(t => t.id === id);
        if (!requisite) return false;
        return this._data.levelsWon >= requisite.unlockLevelsWon && 
               this._data.highScore >= requisite.unlockHighScore;
    }

    /** Assign official logic ID upon purchasing successfully */
    public purchasePaddle(id: number): void {
        if (this._data.unlockedPaddleIds.indexOf(id) === -1) {
            this._data.unlockedPaddleIds.push(id);
            this.save();
        }
    }

    /** Final visual assignment logic binding structural configuration IDs immediately */
    public equipPaddle(id: number): void {
        if (this.isUnlocked(id)) {
            this._data.equippedPaddleId = id;
            this.save();
        }
    }

    /** Clean local runtime storage cache dynamically exclusively */
    public resetData(): void {
        this._data = {
            totalCoins: 0,
            unlockedPaddleIds: [0],
            equippedPaddleId: 0,
            highScore: 0,
            levelsWon: 0,
            levelStars: {}
        };
        this.save();
    }
}
