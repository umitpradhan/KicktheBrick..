import { _decorator, Component, Node, Label, UITransform, Graphics, Color,
    Size, UIOpacity, input, Input, EventTouch } from 'cc';
import { GameManager } from '../Core/GameManager';

const { ccclass } = _decorator;

/**
 * MainMenuUI — Title + Play button, all created programmatically.
 */
@ccclass('MainMenuUI')
export class MainMenuUI extends Component {

    onLoad(): void {
        this._buildUI();
    }

    private _buildUI(): void {
        // ─── Background overlay ─────────────────────────
        const bg = new Node('MenuBg');
        this.node.addChild(bg);
        const bgUt = bg.addComponent(UITransform);
        bgUt.setContentSize(new Size(960, 640));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(20, 20, 40, 255);
        bgGfx.rect(-480, -320, 960, 640);
        bgGfx.fill();

        // ─── Title ──────────────────────────────────────
        const titleNode = new Node('Title');
        this.node.addChild(titleNode);
        titleNode.setPosition(0, 120, 0);
        const titleUt = titleNode.addComponent(UITransform);
        titleUt.setContentSize(new Size(400, 60));
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = 'BRICK BREAKER';
        titleLabel.fontSize = 48;
        titleLabel.lineHeight = 52;
        titleLabel.color = new Color(79, 195, 247, 255);
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        titleLabel.overflow = Label.Overflow.NONE;
        titleLabel.isBold = true;

        // ─── Subtitle ───────────────────────────────────
        const subNode = new Node('Subtitle');
        this.node.addChild(subNode);
        subNode.setPosition(0, 60, 0);
        const subUt = subNode.addComponent(UITransform);
        subUt.setContentSize(new Size(400, 30));
        const subLabel = subNode.addComponent(Label);
        subLabel.string = '3 Levels • Break All Bricks!';
        subLabel.fontSize = 20;
        subLabel.lineHeight = 24;
        subLabel.color = new Color(200, 200, 200, 255);
        subLabel.horizontalAlign = Label.HorizontalAlign.CENTER;

        // ─── Play Button ────────────────────────────────
        const btnNode = new Node('PlayButton');
        this.node.addChild(btnNode);
        btnNode.setPosition(0, -40, 0);
        const btnUt = btnNode.addComponent(UITransform);
        btnUt.setContentSize(new Size(200, 56));

        const btnGfx = btnNode.addComponent(Graphics);
        btnGfx.fillColor = new Color(76, 175, 80, 255); // green
        btnGfx.roundRect(-100, -28, 200, 56, 12);
        btnGfx.fill();

        // Button label
        const btnLabel = new Node('BtnLabel');
        btnNode.addChild(btnLabel);
        const blUt = btnLabel.addComponent(UITransform);
        blUt.setContentSize(new Size(200, 56));
        const bl = btnLabel.addComponent(Label);
        bl.string = 'PLAY';
        bl.fontSize = 28;
        bl.lineHeight = 56;
        bl.color = new Color(255, 255, 255, 255);
        bl.horizontalAlign = Label.HorizontalAlign.CENTER;
        bl.verticalAlign = Label.VerticalAlign.CENTER;
        bl.isBold = true;

        // Touch handler on button
        btnNode.on(Node.EventType.TOUCH_END, this._onPlayPressed, this);

        // ─── Instructions ───────────────────────────────
        const instrNode = new Node('Instructions');
        this.node.addChild(instrNode);
        instrNode.setPosition(0, -140, 0);
        const instrUt = instrNode.addComponent(UITransform);
        instrUt.setContentSize(new Size(500, 40));
        const instrLabel = instrNode.addComponent(Label);
        instrLabel.string = 'Move paddle with mouse or touch\nTap to launch ball';
        instrLabel.fontSize = 16;
        instrLabel.lineHeight = 20;
        instrLabel.color = new Color(150, 150, 150, 255);
        instrLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    }

    private _onPlayPressed(): void {
        GameManager.instance.startGame();
    }
}
