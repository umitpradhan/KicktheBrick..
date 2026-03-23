import { _decorator, Component, Node, Graphics, Label, Color, UITransform, BlockInputEvents, Button, Vec3, tween } from 'cc';

const { ccclass } = _decorator;

@ccclass('InstructionUI')
export class InstructionUI extends Component {

    private _container: Node | null = null;
    private _bgNode: Node | null = null;

    onLoad(): void {
        this.node.active = false;
        
        const ut = this.node.addComponent(UITransform);
        ut.setContentSize(720, 1280);
        this.node.addComponent(BlockInputEvents);

        // Semi-transparent background overlay
        this._bgNode = new Node('BgOverlay');
        const bgUt = this._bgNode.addComponent(UITransform);
        bgUt.setContentSize(720, 1280);
        const bgGfx = this._bgNode.addComponent(Graphics);
        bgGfx.fillColor = new Color(0, 0, 0, 220);
        bgGfx.fillRect(-360, -640, 720, 1280);
        this.node.addChild(this._bgNode);

        // Main Panel Container
        this._container = new Node('MainPanel');
        this.node.addChild(this._container);

        const panelUt = this._container.addComponent(UITransform);
        panelUt.setContentSize(640, 940);
        
        const panelGfx = this._container.addComponent(Graphics);
        panelGfx.fillColor = new Color(30, 40, 50, 255);
        panelGfx.roundRect(-320, -470, 640, 940, 25);
        panelGfx.fill();
        
        panelGfx.strokeColor = new Color(79, 195, 247, 255);
        panelGfx.lineWidth = 4;
        panelGfx.roundRect(-320, -470, 640, 940, 25);
        panelGfx.stroke();

        this._createHeader();
        this._createContent();
        this._createCloseButton();
    }

    private _createHeader(): void {
        const titleNode = new Node('Title');
        this._container!.addChild(titleNode);
        titleNode.setPosition(0, 410);

        const lbl = titleNode.addComponent(Label);
        lbl.string = "INSTRUCTIONS";
        lbl.fontSize = 44;
        lbl.isBold = true;
        lbl.color = new Color(241, 196, 15, 255);
    }

    private _createContent(): void {
        const textNode = new Node('ContentText');
        this._container!.addChild(textNode);
        textNode.setPosition(0, 0); // Perfectly center vertically between title and button

        const ut = textNode.addComponent(UITransform);
        ut.setContentSize(580, 730); // Strict rigid bounds

        const lbl = textNode.addComponent(Label);
        lbl.string = 
`HOW TO PLAY:
Tap to launch the ball. Drag your finger to move the paddle and keep the ball from falling. Break all destroyable bricks to clear the level!

SCORING:
• Normal Brick (Blue): 10 pts
• Double Hit Brick (Orange): 25 pts
• Combo Multiplier: Bounce the ball between multiple bricks without touching the paddle to multiply your score!

BONUS FEATURES & BRICKS:
• Double Points (Gold): Grants 2x score for that hit.
• Explosive (Red): Destroys left and right neighbors.
• Infected Double (Purple): Turns neighbors into Double Hit bricks.
• Infected Solid (Dark Steel): Turns neighbors indestructible!
• Indestructible (Light Steel): Cannot be broken.

PADDLE SHOP:
Use coins collected from playing to unlock new paddles with special powers like +20% Width, Extra Lives, and 2x Points Multipliers.`;
        
        lbl.fontSize = 22;
        lbl.lineHeight = 30;
        lbl.color = new Color(230, 230, 230, 255);
        lbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        lbl.verticalAlign = Label.VerticalAlign.TOP;
        lbl.overflow = Label.Overflow.SHRINK;
        lbl.enableWrapText = true;
    }

    private _createCloseButton(): void {
        const btnNode = new Node('CloseBtn');
        this._container!.addChild(btnNode);
        // Slightly lower to balance the UI
        btnNode.setPosition(0, -400); 
        
        const ut = btnNode.addComponent(UITransform);
        ut.setContentSize(200, 60);

        const gfx = btnNode.addComponent(Graphics);
        gfx.fillColor = new Color(231, 76, 60, 255);
        gfx.roundRect(-100, -30, 200, 60, 15);
        gfx.fill();

        const lblNode = new Node('BtnLabel');
        btnNode.addChild(lblNode);
        const lbl = lblNode.addComponent(Label);
        lbl.string = "CLOSE";
        lbl.fontSize = 25;
        lbl.isBold = true;

        const btn = btnNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        
        btnNode.on(Node.EventType.TOUCH_END, this.hide, this);
    }

    public show(): void {
        this.node.active = true;
        this.node.setSiblingIndex(999);
        
        if (this._container) {
            this._container.scale = new Vec3(0, 0, 0);
            tween(this._container)
                .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
                .start();
        }
    }

    public hide(): void {
        if (this._container) {
            tween(this._container)
                .to(0.2, { scale: new Vec3(0, 0, 0) }, { easing: 'backIn' })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        } else {
            this.node.active = false;
        }
    }
}
