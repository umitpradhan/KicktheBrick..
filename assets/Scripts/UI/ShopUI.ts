import { _decorator, Component, Node, Graphics, Label, Button, Color, UITransform, Size, Widget, tween, Vec3, EventHandler, BlockInputEvents } from 'cc';
import { PaddleTiers } from '../Core/Constants';
import { UserData } from '../Data/UserData';

const { ccclass } = _decorator;

/**
 * Programmatic Shop UI — Built entirely from raw nodes to prevent Scene corruption.
 * Generates an overlay, lists available Paddle Skins, reads prices, and handles 
 * the meta-progression currency transactions securely.
 */
@ccclass('ShopUI')
export class ShopUI extends Component {

    private _container: Node = null!;
    private _listNode: Node = null!;

    onLoad(): void {
        this._buildUI();
        this.node.active = false; // Hidden by default
    }

    private _buildUI(): void {
        const ut = this.node.addComponent(UITransform);
        ut.setContentSize(720, 1280);

        // 1. Full Screen Overlay Background (Dark Semi-Transparent)
        const bgNode = new Node('ShopBackground');
        this.node.addChild(bgNode);
        const bgUt = bgNode.addComponent(UITransform);
        bgUt.setContentSize(720, 1280);
        const bgGfx = bgNode.addComponent(Graphics);
        bgGfx.fillColor = new Color(0, 0, 0, 220);
        bgGfx.rect(-360, -640, 720, 1280);
        bgGfx.fill();
        
        // Rigidly block all touch input from falling through to the Main Menu
        bgNode.addComponent(BlockInputEvents);

        // 2. Container (For bounce animation)
        this._container = new Node('Container');
        this.node.addChild(this._container);

        // Header Title
        const header = new Node('Header');
        this._container.addChild(header);
        header.setPosition(0, 400);
        const headerLabel = header.addComponent(Label);
        headerLabel.string = "PADDLE SHOP";
        headerLabel.fontSize = 50;
        headerLabel.color = new Color(255, 215, 0); // Gold

        // Close Button
        const closeBtnNode = this._createButton("CLOSE", new Color(231, 76, 60), 120, 50, () => this.hide());
        this._container.addChild(closeBtnNode);
        closeBtnNode.setPosition(0, -450);

        // 3. Dynamic List Container
        this._listNode = new Node('List');
        this._container.addChild(this._listNode);
        this._listNode.setPosition(0, 200);

        this.refreshList();
    }

    /**
     * Iterates through Constant PaddleTiers and draws generic row elements.
     */
    public refreshList(): void {
        this._listNode.destroyAllChildren();

        // Top Achievement Tracking indicator
        const achievementInfo = new Node('Achievements');
        this._listNode.addChild(achievementInfo);
        achievementInfo.setPosition(0, 100);
        const achLabel = achievementInfo.addComponent(Label);
        achLabel.string = `🏆 Lifetime: ${UserData.instance.levelsWon} Wins | Best: ${UserData.instance.highScore}`;
        achLabel.fontSize = 28;
        achLabel.color = new Color(46, 204, 113); // Green

        // Top Wallet Balance indicator
        const walletInfo = new Node('Wallet');
        this._listNode.addChild(walletInfo);
        walletInfo.setPosition(0, 60);
        const wLabel = walletInfo.addComponent(Label);
        wLabel.string = `Wallet: ${UserData.instance.totalCoins} Coins`;
        wLabel.fontSize = 25;
        wLabel.color = new Color(241, 196, 15); // Gold

        const startY = -40;
        const gapY = -140;

        PaddleTiers.forEach((tier, index) => {
            const row = new Node(`Row_${tier.id}`);
            this._listNode.addChild(row);
            row.setPosition(0, startY + (index * gapY));

            // Name Label (Title)
            const nameNode = new Node('Title');
            row.addChild(nameNode);
            nameNode.setPosition(-150, 15);
            const nLabel = nameNode.addComponent(Label);
            nLabel.string = `${tier.name}`;
            nLabel.fontSize = 30;
            nLabel.color = tier.color;

            // Power Description Label (Subtitle)
            const powerNode = new Node('PowerDesc');
            row.addChild(powerNode);
            powerNode.setPosition(-150, -20);
            const pLabel = powerNode.addComponent(Label);
            pLabel.string = `*${tier.powerDescription}*`;
            pLabel.fontSize = 20;
            pLabel.color = new Color(200, 200, 200);

            // Logic Hybrid Button Evaluator
            const isUnlocked = UserData.instance.isUnlocked(tier.id);
            const isAchievementMet = UserData.instance.isAchievementMet(tier.id);
            const isEquipped = UserData.instance.equippedPaddleId === tier.id;

            let btnText = "";
            let btnColor = new Color(150, 150, 150);
            let action = () => {};

            if (isEquipped) {
                btnText = "EQUIPPED";
                btnColor = new Color(46, 204, 113); // Green
            } else if (isUnlocked) {
                btnText = "EQUIP";
                btnColor = new Color(52, 152, 219); // Blue
                action = () => {
                    UserData.instance.equipPaddle(tier.id);
                    this.refreshList();
                };
            } else if (!isAchievementMet) {
                // Locked State Visualization
                btnText = `LOCKED`;
                btnColor = new Color(231, 76, 60); // Red
                
                // Show exact logic requirements physically under the button
                const reqNode = new Node('Reqs');
                row.addChild(reqNode);
                reqNode.setPosition(150, -35); // Beneath the button
                const reqLabel = reqNode.addComponent(Label);
                reqLabel.string = `Req: ${tier.unlockLevelsWon} Wins, ${tier.unlockHighScore} Pts`;
                reqLabel.fontSize = 14;
                reqLabel.color = new Color(231, 76, 60);

                action = () => {
                    // Flash red to indicate locked requirement barrier aggressively
                    reqLabel.color = new Color(255, 255, 255);
                    tween(reqLabel).to(0.3, { color: new Color(231, 76, 60) }).start();
                };
            } else {
                // Achievement passed -> Evaluates Coin Expenditure
                btnText = `BUY (${tier.price})`;
                btnColor = new Color(241, 196, 15); // Gold
                
                action = () => {
                    if (UserData.instance.spendCoins(tier.price)) {
                        UserData.instance.purchasePaddle(tier.id);
                        UserData.instance.equipPaddle(tier.id);
                        this.refreshList();
                    } else {
                        // Not enough coins feedback (Red Flash on Wallet globally)
                        wLabel.color = new Color(231, 76, 60);
                        tween(wLabel).to(0.5, { color: new Color(241, 196, 15) }).start();
                    }
                };
            }

            const actionBtn = this._createButton(btnText, btnColor, 200, 50, action);
            row.addChild(actionBtn);
            actionBtn.setPosition(150, 5);
        });
    }

    private _createButton(text: string, color: Color, w: number, h: number, callback: Function): Node {
        const btnNode = new Node('GenericBtn');
        const ut = btnNode.addComponent(UITransform);
        ut.setContentSize(w, h);

        const gfx = btnNode.addComponent(Graphics);
        gfx.fillColor = color;
        gfx.roundRect(-w/2, -h/2, w, h, 10);
        gfx.fill();

        const labelNode = new Node('Label');
        btnNode.addChild(labelNode);
        const lbl = labelNode.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = 24;

        // Cocos Button routing securely mapped
        const btn = btnNode.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        
        btnNode.on(Node.EventType.TOUCH_END, callback, this);
        return btnNode;
    }

    public show(): void {
        this.node.active = true;
        this.refreshList();
        
        this._container.scale = new Vec3(0, 0, 0);
        tween(this._container)
            .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    public hide(): void {
        tween(this._container)
            .to(0.2, { scale: new Vec3(0, 0, 0) }, { easing: 'backIn' })
            .call(() => { this.node.active = false; })
            .start();
    }
}
