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

const WIN_X = 40 * SCALE;
const WIN_Y = 16 * SCALE;
const WIN_W = 384;
const WIN_H = 252;
const cmdList = ["はなす", "つよさ", "そうび", "じゅもん", "どうぐ", "しらべる"];

export default class Command {
    constructor(scene, members) {
        this.scene = scene;
        this.members = members;
        this.command = COMMAND.NONE;
        this.menuList = [];
        let menu = new Menu(null, scene, cmdList, WIN_X, WIN_Y, WIN_W, WIN_H, 3);
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
        console.log("destroy");
        this.scene.input.keyboard.off("keydown-Z", this.onButtonA, this);
        this.scene.input.keyboard.off("keydown-X", this.onButtonB, this);
        this.timer.remove();
    }

    onButtonA() {
        if (this.menuList.length < 1) return;

        let cmd = this.menuList[0].idx;
        if (this.menuList.length == 1) {
	        if (cmd == COMMAND.EQUIP) {
		        drawMembers.call(this, 151, 60);
	        } else if (cmd == COMMAND.SPELL) {
		        drawMembers.call(this, 151, 63);
	        } else if (cmd == COMMAND.ITEM) {
		        drawMembers.call(this, 158, 95);
	        }
        } else if (this.menuList.length == 3) {
	        if (cmd == COMMAND.EQUIP) {
		        if (this.menu.nest == 1) {
                    this.buttonSound.play();
	                this.member = this.members[this.menu.idx];
                    let menu = this.menuList[this.menuList.length-1];
	                menu.setVisible(false);
	                this.menu.setVisible(false);
	                let menu1 = new Menu(menu, this.scene, null, WIN_X, WIN_Y, 428, 252, 0, -1);
	                this.menuList.push(menu1);
	                // 装備一覧を左下に表示
	                let menu2 = new Menu(menu, this.scene, null, WIN_X, WIN_Y+125, 340, 290, 0, -1);
	                menu2.setStrList(this.member.items, true);
	                this.menuList.push(menu2);
	                // 装備選択画面を右上に表示
	                let menu3 = new Menu(menu, this.scene, null, WIN_X+213, WIN_Y, 300, 0);
	                menu3.setEquipment(this.member, menu1, EQUIP.WEAPON);
	                this.menuList.push(menu3);
	                this.menu = menu3;
		        }
	        } else if (cmd == COMMAND.ITEM) {
		        if (this.menu.nest == 1) {
                    this.member = this.members[this.menu.idx];
                    this.menu.fixCursor(true);
                    this.menu = this.menuList[this.menuList.length-1];
                    this.menu.setCursor(0);
                    this.buttonSound.play();
		        }
		    }
        } else if (this.menuList.length > 3) {
	        if (cmd == COMMAND.EQUIP) {
	            console.log("meshList", this.menuList.length);
	        }
        }
        console.log("A: meshList", this.menuList.length);
    }

    onButtonB() {
        console.log("B: meshList", this.menuList.length);
        let nest = this.menu.nest;
        let cmd = this.menuList[0].idx;
        if (cmd == COMMAND.ITEM && nest == 2 && this.menuList.length == 3) {
            this.member = null;
            this.menu.setCursor(-1);
            this.menu = this.menuList[1];
            this.menu.fixCursor(false);
            return;
        } else if (cmd == COMMAND.EQUIP && this.menuList.length == 6) {
            for (let i = 0; i < 3; i++) {
                let menu = this.menuList.pop();
                menu.destroy();
            }
            this.menuList[1].setVisible(true);
            this.menuList[2].setVisible(true);
            this.menu = this.menuList[1];
            return;
        }

        let menu = this.menuList.pop();
        menu.destroy();
        if (this.menuList.length < 1) {
            this.scene.exitCommand();
            return;
        }

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
            } else if (this.menuList.length == 6) {
                if (cmd == COMMAND.EQUIP) {
	                let menu = this.menuList[3];
	                console.log(menu);
                }
            }
        }

        this.scene.time.delayedCall(200, () => {
	        this.isListen = true;
        });
    }
}

function drawMembers(x, y) {
    let cmd = this.menuList[0].idx;
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

    if (cmd != COMMAND.SPELL) {
	    let member = this.members[0];
	    menu = new Menu(menu, this.scene, member.items, WIN_X+191, WIN_Y, 310, 430, 0, -1);
	    this.menuList.push(menu);
    }
}
