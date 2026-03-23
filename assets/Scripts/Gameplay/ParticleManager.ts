import { _decorator, Component, Node, Graphics, Color, UIOpacity, tween, Vec3, NodePool, UITransform } from 'cc';

const { ccclass } = _decorator;

/**
 * ParticleManager — Uses a dynamic NodePool to spawn procedural debris shrapnel
 * whenever a brick is destroyed, matching its origin coordinate and primary color.
 * Uses `cc.tween` to drive radial explosion velocity and opacity fade.
 */
@ccclass('ParticleManager')
export class ParticleManager extends Component {

    public static instance: ParticleManager;

    private _pool: NodePool = new NodePool();

    onLoad(): void {
        if (!ParticleManager.instance) {
            ParticleManager.instance = this;
        } else {
            console.warn("ParticleManager: secondary instance destroyed.");
            this.destroy();
            return;
        }
    }

    /**
     * Spawns a radial burst of colored squares at the given coordinate.
     */
    public spawnBurst(x: number, y: number, color: Color, amount: number = 8): void {
        for (let i = 0; i < amount; i++) {
            const particle = this._getParticleNode();
            
            // Re-parent to the ParticleManager node
            particle.parent = this.node;
            particle.setPosition(x, y, 0);

            // Draw graphic using passed brick color
            const gfx = particle.getComponent(Graphics)!;
            gfx.clear();
            gfx.fillColor = color;
            gfx.rect(-4, -4, 8, 8);
            gfx.fill();

            // Reset opacity
            const opacity = particle.getComponent(UIOpacity)!;
            opacity.opacity = 255;

            // Compute randomized trajectory (burst radius: 40-100 pixels)
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 60;
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            // Randomized duration for organic effect
            const duration = 0.3 + Math.random() * 0.3;

            // Tween position + Rotation + Opacity
            tween(particle)
                .to(duration, { position: new Vec3(targetX, targetY, 0) }, { easing: 'cubicOut' })
                .start();

            tween(particle)
                .to(duration, { eulerAngles: new Vec3(0, 0, Math.random() * 360) })
                .start();

            tween(opacity)
                .to(duration, { opacity: 0 }, { easing: 'quartIn' })
                .call(() => {
                    this._reclaimParticleNode(particle);
                })
                .start();
        }
    }

    private _getParticleNode(): Node {
        let node: Node | null = null;
        if (this._pool.size() > 0) {
            node = this._pool.get()!;
        } else {
            node = new Node("ProceduralParticle");
            node.addComponent(UITransform);
            node.addComponent(Graphics);
            node.addComponent(UIOpacity);
        }
        return node;
    }

    private _reclaimParticleNode(node: Node): void {
        if (node && node.isValid) {
            node.removeFromParent();
            this._pool.put(node);
        }
    }

    onDestroy(): void {
        this._pool.clear();
        if (ParticleManager.instance === this) {
            ParticleManager.instance = null!;
        }
    }
}
