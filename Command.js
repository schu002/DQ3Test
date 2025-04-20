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
        this.x = x;
        this.y = y;
        this.scene = scene;
        this.members = members;
        this.command = COMMAND.NONE;
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
        this.timer.remove();
    }

    onButtonA() {
        let cmd = this.menuList[0].idx;
        if (this.menuList.length == 1) {
	        if (cmd == COMMAND.EQUIP) {
		        drawMembers.call(this, 151, 60);
	        } else if (cmd == COMMAND.SPELL) {
		        drawMembers.call(this, 246, 63);
	        } else if (cmd == COMMAND.ITEM) {
		        drawMembers.call(this, 158, 95);
	        }
        } else if (this.menuList.length == 3) {
	        if (cmd == COMMAND.EQUIP) {
		        if (this.menu.nest == 1) {
	                let member = this.members[this.menu.idx];
                    let menu = this.menuList[this.menuList.length-1];
	                menu.setVisible(false);
	                this.menu.setVisible(false);
	                menu = new Menu(menu, this.scene, null, this.x, this.y+125, 340, 350, 0, -1);
	                menu.setStrList(member.items, true);
	                this.menuList.push(menu);
                    this.buttonSound.play();
		        }
	        } else if (cmd == COMMAND.ITEM) {
		        if (this.menu.nest == 1) {
                    this.menu.fixCursor(true);
                    this.menu = this.menuList[this.menuList.length-1];
                    this.menu.setCursor(0);
                    this.buttonSound.play();
		        }
		    }
        }
    }

    onButtonB() {
        let nest = this.menu.nest;
        let cmd = this.menuList[0].idx;
        if (cmd == COMMAND.ITEM && nest == 2 && this.menuList.length == 3) {
            this.menu.setCursor(-1);
            this.menu = this.menuList[1];
            this.menu.fixCursor(false);
            return;
        }

        let menu = this.menuList.pop();
        menu.destroy();
        if (this.menuList.length < 1) return;

        if (nest == 1 && this.menuList.length == 2) {
	        menu = this.menuList.pop();
            menu.destroy();
        }
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

        let cmd = this.menuList[0].idx;
        this.isListen = false;
        if (this.menu.moveCursor(dir)) {
            if (this.menu.nest == 1 && this.menuList.length == 3) {
                if (cmd == COMMAND.EQUIP || cmd == COMMAND.ITEM) {
	                let member = this.members[this.menu.idx];
	                this.menuList[2].setStrList(member.items);
	            }
            }
        }

        this.scene.time.delayedCall(200, () => {
	        this.isListen = true;
        });
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
    menu = new Menu(menu, this.scene, member.items, this.x+191, 31, 310, 430, 0, -1);
    this.menuList.push(menu);
}

export default Command;
