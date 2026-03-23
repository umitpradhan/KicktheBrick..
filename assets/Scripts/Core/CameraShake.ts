import { _decorator, Component, Vec3 } from 'cc';
import { GameEvents } from './Constants';
import { EventManager } from './EventManager';

const { ccclass } = _decorator;

/**
 * CameraShake — Decaying randomized offset displacement attached to Main Camera.
 */
@ccclass('CameraShake')
export class CameraShake extends Component {

    private _originalPos: Vec3 = new Vec3();
    private _shakeDuration: number = 0;
    private _shakeIntensity: number = 0;
    private _isShaking: boolean = false;

    onLoad(): void {
        this._originalPos.set(this.node.position);
        EventManager.on(GameEvents.SCREEN_SHAKE, this.triggerShake, this);
    }

    onDestroy(): void {
        EventManager.off(GameEvents.SCREEN_SHAKE, this.triggerShake, this);
    }

    /**
     * Start shaking the camera.
     * @param intensity Max displacement in pixels
     * @param duration Duration in seconds
     */
    public triggerShake(intensity: number = 15, duration: number = 0.3): void {
        // If already shaking, take the max intensity and extend duration
        this._shakeIntensity = Math.max(this._shakeIntensity, intensity);
        this._shakeDuration = Math.max(this._shakeDuration, duration);
        this._isShaking = true;
    }

    update(dt: number): void {
        if (!this._isShaking) return;

        if (this._shakeDuration > 0) {
            this._shakeDuration -= dt;
            
            // Random displacement applying current strength
            const offsetX = (Math.random() - 0.5) * 2 * this._shakeIntensity;
            const offsetY = (Math.random() - 0.5) * 2 * this._shakeIntensity;
            
            // Decay intensity over time for smoother trail off
            this._shakeIntensity *= 0.9;

            this.node.setPosition(
                this._originalPos.x + offsetX,
                this._originalPos.y + offsetY,
                this._originalPos.z
            );
        } else {
            // End shake precisely back at origin point
            this._isShaking = false;
            this._shakeIntensity = 0;
            this.node.setPosition(this._originalPos);
        }
    }
}
