import { _decorator, Component, Node, Label, Color, Graphics, UITransform, Size, tween, Vec3, UIOpacity, BlockInputEvents, Layout, Button } from 'cc';
import { UserData } from '../Data/UserData';
import { GameManager } from '../Core/GameManager';
import { LevelConfigs } from '../Data/LevelConfigs';

const { ccclass } = _decorator;

/**
 * LevelDashboardUI — Programmatically generates the explicit Level Select Grid.
 * Evaluates `highestUnlockedLevel` mapping 1-20 procedural blocks visually mapping Stars cleanly.
 */
@ccclass('LevelDashboardUI')
export class LevelDashboardUI extends Component {

    private _container: Node | null = null;
    private _uiOpacity: UIOpacity | null = null;

    onLoad(): void {
        // Enforce BlockInputEvents absorbing arbitrary touches behind dashboard natively
        let ut = this.node.getComponent(UITransform);
        if (!ut) ut = this.node.addComponent(UITransform);
        ut.setContentSize(new Size(720, 1280));
        this.node.addComponent(BlockInputEvents);

        this._uiOpacity = this.node.addComponent(UIOpacity);
        this._uiOpacity.opacity = 0;

        // Dark Background 
        const bgNode = new Node('BgGraphics');
        this.node.addChild(bgNode);
        const bgGfx = bgNode.addComponent(Graphics);
        bgGfx.fillColor = new Color(15, 20, 30, 245);
        bgGfx.rect(-360, -640, 720, 1280);
        bgGfx.fill();

        // Main Container Scaling natively
        this._container = new Node('GridContainer');
        this.node.addChild(this._container);

        // Header Label
        const headerNode = new Node('Header');
        this._container.addChild(headerNode);
        headerNode.setPosition(0, 500);
        const headerLbl = headerNode.addComponent(Label);
        headerLbl.string = "SELECT LEVEL";
        headerLbl.fontSize = 42;
        headerLbl.isBold = true;

        // Close Button (Top Right)
        this._createCloseButton(this._container);

        // Core Layout Grid (4x5 array easily parsing bounds safely natively)
        this._createLevelGrid(this._container);

        this.node.active = false;
    }

    /** Expose public entry point resetting grid organically checking recent unlocks securely */
    public show(): void {
        this.node.active = true;
        
        // Force redraw grid verifying active milestones natively avoiding staleness reliably
        const containerNode = this._container?.getChildByName('LayoutGrid');
        if (containerNode) {
            containerNode.destroy();
            this._createLevelGrid(this._container!);
        }

        if (this._uiOpacity) {
            this._uiOpacity.opacity = 0;
            tween(this._uiOpacity).to(0.3, { opacity: 255 }).start();
        }

        if (this._container) {
            this._container.scale = new Vec3(0.5, 0.5, 0.5);
            tween(this._container).to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
        }
    }

    public hide(): void {
        if (this._uiOpacity) {
            tween(this._uiOpacity).to(0.2, { opacity: 0 }).start();
        }
        if (this._container) {
            tween(this._container)
                .to(0.2, { scale: new Vec3(0.5, 0.5, 0.5) }, { easing: 'backIn' })
                .call(() => {
                    this.node.active = false;
                })
                .start();
        }
    }

    private _createCloseButton(parent: Node): void {
        const exitNode = new Node('CloseBtn');
        parent.addChild(exitNode);
        exitNode.setPosition(250, 500);

        const ut = exitNode.addComponent(UITransform);
        ut.setContentSize(60, 60);

        const gfx = exitNode.addComponent(Graphics);
        gfx.fillColor = new Color(231, 76, 60); // Red Exit visually
        gfx.circle(0, 0, 30);
        gfx.fill();

        const xLabel = new Node('X');
        exitNode.addChild(xLabel);
        const lbl = xLabel.addComponent(Label);
        lbl.string = "X";
        lbl.fontSize = 28;
        lbl.isBold = true;

        const btn = exitNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        exitNode.on(Node.EventType.TOUCH_END, this.hide, this);
    }

    private _createLevelGrid(parent: Node): void {
        const layoutNode = new Node('LayoutGrid');
        parent.addChild(layoutNode);
        
        // Center offset layout explicitly mapping standard 720 grids securely
        layoutNode.setPosition(0, 50); 
        
        const ut = layoutNode.addComponent(UITransform);
        ut.setContentSize(500, 700);

        const layout = layoutNode.addComponent(Layout);
        layout.type = Layout.Type.GRID;
        layout.resizeMode = Layout.ResizeMode.NONE;
        layout.startAxis = Layout.AxisDirection.HORIZONTAL;
        layout.cellSize = new Size(110, 120);
        layout.spacingX = 15;
        layout.spacingY = 20;

        const totalLevels = LevelConfigs.length; // 20 configured bounds reliably
        const highestUnlocked = UserData.instance.highestUnlockedLevel;

        for (let i = 0; i < totalLevels; i++) {
            const isUnlocked = i <= highestUnlocked;
            const earnedStars = UserData.instance.levelStars[i] || 0;
            
            const btnNode = this._createGridItem(i, isUnlocked, earnedStars);
            layoutNode.addChild(btnNode);
        }
    }

    private _createGridItem(levelIndex: number, isUnlocked: boolean, earnedStars: number): Node {
        const itemNode = new Node(`LevelItem_${levelIndex}`);
        const ut = itemNode.addComponent(UITransform);
        ut.setContentSize(110, 120);

        const gfx = itemNode.addComponent(Graphics);
        
        if (!isUnlocked) {
            gfx.fillColor = new Color(80, 80, 80); // Locked Grey
        } else {
            gfx.fillColor = new Color(52, 152, 219); // Unlocked Blue
        }
        
        gfx.roundRect(-55, -60, 110, 120, 15);
        gfx.fill();

        // Level Number Label directly mapping abstract visual indexes cleanly
        const numNode = new Node('IndexLabel');
        itemNode.addChild(numNode);
        numNode.setPosition(0, 10);
        const lbl = numNode.addComponent(Label);
        lbl.string = isUnlocked ? `${levelIndex + 1}` : `LOCKED`;
        lbl.fontSize = isUnlocked ? 36 : 18;
        lbl.isBold = true;

        if (isUnlocked) {
            // Evaluates abstract ★ rating natively pushing 1-3 combinations visually
            const starNode = new Node('StarLabel');
            itemNode.addChild(starNode);
            starNode.setPosition(0, -35); // Beneath number natively
            const starLbl = starNode.addComponent(Label);
            
            let starsIcon = "";
            for (let s = 1; s <= 3; s++) {
                starsIcon += (s <= earnedStars) ? "★" : "☆";
            }
            starLbl.string = starsIcon;
            starLbl.fontSize = 18;
            starLbl.color = new Color(241, 196, 15); // Solid gold

            // Allow touch mechanics routing level arrays explicitly matching index bounds natively
            const btn = itemNode.addComponent(Button);
            btn.transition = Button.Transition.SCALE;
            itemNode.on(Node.EventType.TOUCH_END, () => {
                this.hide();
                GameManager.instance.loadSpecificLevel(levelIndex);
            }, this);
        }

        return itemNode;
    }
}
