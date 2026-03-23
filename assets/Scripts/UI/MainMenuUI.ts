import { _decorator, Component, Node, Label, tween, Vec3, UITransform, Graphics, Button, Color, BlockInputEvents, Size } from 'cc';
import { GameManager } from '../Core/GameManager';
import { GameState, GameEvents } from '../Core/Constants';
import { ShopUI } from './ShopUI';
import { LevelDashboardUI } from './LevelDashboardUI';
import { InstructionUI } from './InstructionUI';

const { ccclass, property } = _decorator;

/**
 * MainMenuUI — Title + Play button.
 * UI elements are defined in the scene editor and wired via @property.
 */
@ccclass('MainMenuUI')
export class MainMenuUI extends Component {

    @property({ type: Node, tooltip: 'Play button node' })
    public playButton: Node | null = null;

    // Dynamic Shop Ref
    private _shopUI: ShopUI | null = null;
    private _levelDashboardUI: LevelDashboardUI | null = null;
    private _instructionUI: InstructionUI | null = null;

    onEnable(): void {
        this.node.scale = new Vec3(0, 0, 0);
        tween(this.node)
            .to(0.5, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    onLoad(): void {
        if (!this.playButton) this.playButton = this.node.getChildByName('PlayButton');

        // Dynamically enforce a strictly sized BlockInputEvents area across the root
        let ut = this.node.getComponent(UITransform);
        if (!ut) ut = this.node.addComponent(UITransform);
        ut.setContentSize(new Size(720, 1280));
        if (!this.node.getComponent(BlockInputEvents)) {
            this.node.addComponent(BlockInputEvents);
        }

        // Dynamically program and append the Shop button beneath Play
        this._createShopButton();
        this._createInstructionButton();

        // Instantiate background Shop logic container generically
        const shopNode = new Node('ShopUI_System');
        this.node.addChild(shopNode);
        this._shopUI = shopNode.addComponent(ShopUI);
        
        // Instantiate Level Dashboard programmatic system reliably alongside Shop
        const levelNode = new Node('LevelDashboard_System');
        this.node.addChild(levelNode);
        this._levelDashboardUI = levelNode.addComponent(LevelDashboardUI);

        // Instantiate Instruction UI 
        const instrNode = new Node('InstructionUI_System');
        this.node.addChild(instrNode);
        this._instructionUI = instrNode.addComponent(InstructionUI);

        // Bind touch handler on the play button securely inside onLoad scope
        if (this.playButton) {
            this.playButton.on(Node.EventType.TOUCH_END, this._onPlayPressed, this);
        }
    }

    private _createShopButton(): void {
        const btnNode = new Node('ShopBtn');
        this.node.addChild(btnNode);
        
        // Offset below typical absolute (-200) position of Play
        btnNode.setPosition(0, -300); 
        
        const ut = btnNode.addComponent(UITransform);
        ut.setContentSize(200, 60);

        const gfx = btnNode.addComponent(Graphics);
        gfx.fillColor = new Color(155, 89, 182); // Purple programmatic aesthetic
        gfx.roundRect(-100, -30, 200, 60, 15);
        gfx.fill();

        const lblNode = new Node('Label');
        btnNode.addChild(lblNode);
        const lbl = lblNode.addComponent(Label);
        lbl.string = "PADDLE SHOP";
        lbl.fontSize = 25;

        const btn = btnNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btnNode.on(Node.EventType.TOUCH_END, () => {
            if (this._shopUI) this._shopUI.show();
        }, this);
    }

    private _createInstructionButton(): void {
        const btnNode = new Node('InstrBtn');
        this.node.addChild(btnNode);
        
        // Offset below Shop typical absolute position
        btnNode.setPosition(0, -380); 
        
        const ut = btnNode.addComponent(UITransform);
        ut.setContentSize(240, 60);

        const gfx = btnNode.addComponent(Graphics);
        gfx.fillColor = new Color(52, 152, 219); // Blue thematic programmatic aesthetic
        gfx.roundRect(-120, -30, 240, 60, 15);
        gfx.fill();

        const lblNode = new Node('Label');
        btnNode.addChild(lblNode);
        const lbl = lblNode.addComponent(Label);
        lbl.string = "INSTRUCTIONS";
        lbl.fontSize = 25;

        const btn = btnNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btnNode.on(Node.EventType.TOUCH_END, () => {
            if (this._instructionUI) this._instructionUI.show();
        }, this);
    }

    onDestroy(): void {
        if (this.playButton) {
            this.playButton.off(Node.EventType.TOUCH_END, this._onPlayPressed, this);
        }
    }

    private _onPlayPressed(): void {
        if (this._levelDashboardUI) {
            this._levelDashboardUI.show();
        } else {
            // Fallback natively 
            GameManager.instance.startGame();
        }
    }
}
