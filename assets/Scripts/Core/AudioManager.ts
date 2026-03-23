import { _decorator, Component, AudioSource, AudioClip } from 'cc';

const { ccclass, property } = _decorator;

/**
 * AudioManager — Singleton bridge handling Game Feel (Juice) sounds.
 * Tolerates null AudioClips allowing safe drag-and-drop workflow in the editor.
 */
@ccclass('AudioManager')
export class AudioManager extends Component {

    public static instance: AudioManager;

    @property({ type: AudioClip, tooltip: 'Background Music Track' })
    public bgmAudio: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: 'Satisfying bonk for paddle' })
    public paddleBonkAudio: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: 'Glass shattering sound for basic bricks' })
    public brickShatterAudio: AudioClip | null = null;

    @property({ type: AudioClip, tooltip: 'Heavy bass explosion for red bricks' })
    public explosiveAudio: AudioClip | null = null;

    private _audioSource: AudioSource | null = null;

    onLoad(): void {
        if (!AudioManager.instance) {
            AudioManager.instance = this;
        } else {
            console.warn("AudioManager: secondary instance destroyed.");
            this.destroy();
            return;
        }

        // Generate AudioSource for Background Music layering
        this._audioSource = this.node.addComponent(AudioSource);
        this._audioSource.loop = true;
        this._audioSource.volume = 0.5;

        if (this.bgmAudio) {
            this._audioSource.clip = this.bgmAudio;
            this._audioSource.play();
        }
    }

    public playPaddleBonk(): void {
        if (this.paddleBonkAudio && this._audioSource) {
            this._audioSource.playOneShot(this.paddleBonkAudio, 1.0);
        }
    }

    public playBrickShatter(): void {
        if (this.brickShatterAudio && this._audioSource) {
            this._audioSource.playOneShot(this.brickShatterAudio, 0.8);
        }
    }

    public playExplosion(): void {
        if (this.explosiveAudio && this._audioSource) {
            this._audioSource.playOneShot(this.explosiveAudio, 1.0);
        }
    }
}
