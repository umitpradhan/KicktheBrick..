import { Node, Graphics, UITransform, Size } from 'cc';
import { BrickType, BrickColors, GameConfig } from '../Core/Constants';
import { Brick } from './Brick';

/**
 * BrickFactory — creates brick nodes programmatically.
 * Each brick is a Node with Graphics (colored rect) + Brick component.
 * Uses Factory pattern: type → fully configured node.
 */
export class BrickFactory {

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
        const node = new Node(`Brick_${type}_${x}_${y}`);
        parent.addChild(node);

        // UITransform for collision detection sizing
        const ut = node.addComponent(UITransform);
        ut.setContentSize(new Size(width, height));
        ut.setAnchorPoint(0.5, 0.5);

        // Graphics for rendering
        node.addComponent(Graphics);

        // Brick component for game logic
        const brick = node.addComponent(Brick);
        brick.init(type, width, height, col, row);

        // Position
        node.setPosition(x, y, 0);

        return node;
    }
}
