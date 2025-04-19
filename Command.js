import Menu from "./Menu.js";

const COMMAND = {
    NONE	: -1,
    TALK	: 0,
    ABILITY	: 1,
    EQUIP	: 2,
    SPELL	: 3,
    ITEM	: 4,
    CHECK	: 5
};

const cmdList = ["はなす", "つよさ", "そうび", "じゅもん", "どうぐ", "しらべる"];

class Command {
    constructor(scene, members, x, y) {
        x *= SCALE;
        y *= SCALE;
        this.scene = scene;
        this.members = members;
        this.command = COMMAND.NONE;
        this.drawList = scene.add.container(x, y);
        this.drawList.setScrollFactor(0);
        this.menuList = [];
        let menu = new Menu(null, scene, cmdList, x, y, 384, 252, 3);
        menu.setTitle("コマンド", true);
        this.menuList.push(menu);
        this.menu = menu;
        this.buttonSound = scene.sound.add("button", { loop: false, volume: 0.2 });
        this.buttonSound.play();

        scene.input.keyboard.on("keydown-Z", this.onButtonA, this);
        scene.input.keyboard.on("keydown-X", this.onButtonB, this);
        this.keys = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
	        up: Phaser.Input.Keyboard.KeyCodes.W,
	        down: Phaser.Input.Keyboard.KeyCodes.S,
	        left: Phaser.Input.Keyboard.KeyCodes.A,
	        right: Phaser.Input.Keyboard.KeyCodes.D
	    });
        this.isListen = true;

        this.timer = scene.time.addEvent({
            delay: 10,
            loop: true,
            callback: () => {
                this.update();
            }
        });
    }

    destroy() {
        this.drawList.destroy();
        this.timer.remove();
    }

    onButtonA() {
        let menu = this.menuList[this.menuList.length-1];
        if (this.menuList.length == 1) {
	        if (menu.idx == COMMAND.EQUIP) {
		        drawMembers.call(this, 238, 60);
	        } else if (menu.idx == COMMAND.SPELL) {
		        drawMembers.call(this, 246, 63);
	        } else if (menu.idx == COMMAND.ITEM) {
		        drawMembers.call(this, 158, 95);
	        }
        }
    }

    onButtonB() {
        let menu = this.menuList.pop();
        menu.destroy();
        if (this.menuList.length < 1) return;
        menu = this.menuList[this.menuList.length-1];
        menu.fixCursor(false);
	    this.menu = menu;
    }

    update() {
        if (!this.isListen) return;

        let dir = -1;
        if		(this.keys.up.isDown || this.wasd.up.isDown) dir = DIR.UP;
        else if (this.keys.down.isDown || this.wasd.down.isDown) dir = DIR.DOWN;
        else if (this.keys.left.isDown || this.wasd.left.isDown) dir = DIR.LEFT;
        else if (this.keys.right.isDown || this.wasd.right.isDown) dir = DIR.RIGHT;
        else return;

        this.isListen = false;
        if (this.menu.moveCursor(dir)) {
            if (this.menuList[0].idx == COMMAND.ITEM && this.menu.nest == 1 && this.menuList.length == 3) {
                let member = this.members[this.menu.idx];
                this.menuList[2].setStrList(member.items);
            }
        }

        this.scene.time.delayedCall(200, () => {
	        this.isListen = true;
        });
    }

    drawRect(x, y, w, h, title=null) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.lineStyle(14, 0xffffff);
        rect.fillStyle(0x000000);
        rect.strokeRoundedRect(x, y, w, h, 5);
        rect.fillRoundedRect(x, y, w, h, 5);
        if (title) {
            let tw = 2 + 33*title.length;
            let ofsx = Math.floor((w-tw)/2);
            this.drawFill(x+ofsx, y-9, tw, 12);
            this.drawText(x+ofsx+4, y-14, title);
        }
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.scene.add.graphics();
        this.drawList.add(rect);
        rect.fillStyle(col);
        rect.fillRect(x, y, w, h);
    }

    drawText(x, y, msg) {
        for (const ch of msg) {
	        let text = this.scene.add.text(x, y, ch, {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '38px',
	            color: '#ffffff'
            });
	        this.drawList.add(text);
	        text.setScale(0.9, 1.0);
	        x += 30;
	    }
    }
}

function drawMembers(x, y) {
    this.buttonSound.play();
    let menu = this.menuList[this.menuList.length-1];
    let idx = menu.idx;
    menu.fixCursor(true);

    let nameList = [];
    this.members.forEach(member => nameList.push(member.name));
    menu = new Menu(menu, this.scene, nameList, x, y, 240, 310);
    menu.setTitle(cmdList[idx]);
    this.menuList.push(menu);
    this.menu = menu;

    let member = this.members[0];
    menu = new Menu(menu, this.scene, member.items, x+114, 31, 310, 430, 0, -1);
    this.menuList.push(menu);
}

export default Command;
