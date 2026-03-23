import { Node, Graphics, UITransform, Size, NodePool } from 'cc';
import { BrickType, BrickColors, GameConfig } from '../Core/Constants';
import { Brick } from './Brick';

/**
 * BrickFactory — creates brick nodes programmatically.
 * Uses a persistent NodePool to guarantee zero GC spikes across 20 escalating levels.
 */
export class BrickFactory {

    private static _pool: NodePool = new NodePool();

    /**
     * Create a single brick node.
     * @param type - BrickType enum
     * @param x - x position in parent space
     * @param y - y position in parent space
     * @param width - brick width
     * @param height - brick height
     * @param parent - parent node to add child to
     * @returns the created brick Node
     */
    public static createBrick(
        type: BrickType,
        x: number,
        y: number,
        width: number,
        height: number,
        parent: Node,
        col: number,
        row: number
    ): Node {
        let node: Node;

        // Retrieve from generic pool to dodge GC allocation overhead
        if (this._pool.size() > 0) {
            node = this._pool.get()!;
            parent.addChild(node);
        } else {
            node = new Node(`Brick`);
            parent.addChild(node);

            // UITransform for collision detection sizing
            node.addComponent(UITransform);
            // Graphics for rendering
            node.addComponent(Graphics);
            // Brick component for game logic
            node.addComponent(Brick);
        }
        
        node.name = `Brick_${type}_${x}_${y}`;
        node.active = true;

        const ut = node.getComponent(UITransform)!;
        ut.setContentSize(new Size(width, height));
        ut.setAnchorPoint(0.5, 0.5);

        const brick = node.getComponent(Brick)!;
        brick.init(type, width, height, col, row);

        // Position
        node.setPosition(x, y, 0);

        return node;
    }

    /**
     * Safely returns a detonated brick back into memory storage
     */
    public static reclaimBrick(node: Node): void {
        node.active = false;
        node.removeFromParent();
        this._pool.put(node);
    }
}
