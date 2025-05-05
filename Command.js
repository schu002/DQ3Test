import Menu from "./Menu.js";
import Message from "./Message.js";
import DrawStatus from "./DrawStatus.js";
import TalkManager from "./TalkManager.js";
import { getNumberStr } from "./util.js";

const WIN_X = 40 * SCALE;
const WIN_Y = 8 * SCALE;
const WIN_W = 384;
const WIN_H = 252;
const cmdList = ["はなす", "つよさ", "そうび", "じゅもん", "どうぐ", "しらべる"];

export default class Command {
    constructor(scene, members, layer=null) {
        this.scene = scene;
        this.members = members;
        this.command = COMMAND.NONE;
        this.menuList = [];
        this.message = null;
        this.status = null;
        let menu = new Menu(null, scene, cmdList, WIN_X, WIN_Y, WIN_W, WIN_H, 3);
        menu.setTitle("コマンド", true);
        this.menuList.push(menu);
        this.menu = menu;
        this.buttonSound = scene.sound.add("button", { loop: false, volume: 0.2 });
        this.buttonSound.play();
        this.isListen = true;
        this.isFinish = false;
        let player = members[0];
	    this.npc = (layer)? layer.findNPC(player.pos, player.direction) : null;
	    if (this.npc) {
            this.command = COMMAND.TALK;
            this.talk();
        } else {
            this.status = new DrawStatus(scene, members, 80, 304);
        }

        scene.input.keyboard.on("keydown-Z", this.onButtonA, this);
        scene.input.keyboard.on("keydown-X", this.onButtonB, this);
        this.keys = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
	        up: Phaser.Input.Keyboard.KeyCodes.W,
	        down: Phaser.Input.Keyboard.KeyCodes.S,
	        left: Phaser.Input.Keyboard.KeyCodes.A,
	        right: Phaser.Input.Keyboard.KeyCodes.D
	    });

        this.timer = scene.time.addEvent({
            delay: 10,
            loop: true,
            callback: () => {
                this.update();
            }
        });
    }

    destroy() {
        while (this.menuList.length > 0) {
            let menu = this.menuList.pop();
            menu.destroy();
        }
        if (this.npc) this.npc.setTalking(false);
        if (this.message) this.message.destroy();
        if (this.status) this.status.destroy();
        this.scene.input.keyboard.off("keydown-Z", this.onButtonA, this);
        this.scene.input.keyboard.off("keydown-X", this.onButtonB, this);
        this.timer.remove();
    }

    onButtonA() {
        if (this.message && this.message.isFinish()) {
            this.isFinish = true;
        }
        if (this.isFinish) {
            this.scene.exitCommand();
            return;
        }
        if (this.menuList.length < 1) return;

        this.buttonSound.play();
        this.command = this.menuList[0].idx;
        // はなす
        if (this.command == COMMAND.TALK) {
            if (this.message && this.message.isConfirmYesNo()) {
                this.message.setConfirm((this.menu.idx == 0)? CONFIRM.YES : CONFIRM.NO);
                this.deleteLastMenu();
            }
            this.talk();
        }
        // つよさ
        else if (this.command == COMMAND.ABILITY) {
            if (this.menuList.length == 1) {
                this.menu.fixCursor(1);
                const strList = ["つよさをみる", "じょうたい", "ならびかた"];
                let menu1 = new Menu(this.menu, this.scene, strList, WIN_X-14, WIN_Y+60, 280, 250);
                menu1.setTitle("つよさ", true);
                this.menuList.push(menu1);
                this.menu = menu1;
            }
        }
        // そうび
        else if (this.command == COMMAND.EQUIP) {
            if (this.menuList.length == 1) {
		        drawMembers.call(this, 151, 45);
            } else if (this.menuList.length == 3) {
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
            } else if (this.menuList.length > 3) {
	            console.log("meshList", this.menuList.length);
            }
        }
        // じゅもん
        else if (this.command == COMMAND.SPELL) {
            if (this.menuList.length == 1) {
		        drawMembers.call(this, 166, 47);
            }
        }
        // どうぐ
        else if (this.command == COMMAND.ITEM) {
            if (this.menuList.length == 1) {
		        drawMembers.call(this, 158, 79);
            } else if (this.menuList.length == 3) {
		        if (this.menu.nest == 1) {
                    this.member = this.members[this.menu.idx];
                    this.menu.fixCursor(true);
                    this.menu = this.menuList[this.menuList.length-1];
                    this.menu.setCursor(0);
                    this.buttonSound.play();
		        }
            }
        }
        // しらべる
        else if (this.command == COMMAND.CHECK) {
	        if (this.menuList.length == 1) {
	            this.createTalkMenu();
	        }
        }
    }

    onButtonB() {
        if (this.isFinish) {
            this.scene.exitCommand();
            return;
        }
        let nest = this.menu.nest;
        if (this.command == COMMAND.TALK) {
            if (this.message && this.message.isConfirmYesNo()) {
                this.message.setConfirm(CONFIRM.NO);
                this.deleteLastMenu();
                this.talk();
                return;
            }
        } else if (this.command == COMMAND.ITEM) {
            if (nest == 2 && this.menuList.length == 3) {
                this.member = null;
                this.menu.setCursor(-1);
                this.menu = this.menuList[1];
                this.menu.fixCursor(false);
                return;
            }
        } else if (this.command == COMMAND.EQUIP) {
            if (this.menuList.length == 6) {
                for (let i = 0; i < 3; i++) {
                    this.deleteLastMenu();
                }
                this.menuList[1].setVisible(true);
                this.menuList[2].setVisible(true);
                this.menu = this.menuList[1];
                return;
            }
        }

        this.deleteLastMenu();
        if (this.menuList.length < 1) {
            this.scene.exitCommand();
            return;
        }

        if (nest == 1 && this.menuList.length == 2) {
            this.deleteLastMenu();
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

        if (this.message && this.message.isFinish()) {
            this.isFinish = true;
            dir = -1;
        }
        if (this.isFinish) {
            this.scene.exitCommand();
            return;
        }

        this.isListen = false;
        if (this.menu.moveCursor(dir)) {
            if (this.menu.nest == 1 && this.menuList.length == 3) {
                if (this.command == COMMAND.EQUIP || this.command == COMMAND.ITEM) {
	                let member = this.members[this.menu.idx];
	                this.menuList[2].setStrList(member.items);
	            }
            } else if (this.menuList.length == 6) {
                if (this.command == COMMAND.EQUIP) {
	                let menu = this.menuList[3];
	                console.log(menu);
                }
            }
        }

        this.scene.time.delayedCall(200, () => {
	        this.isListen = true;
        });
    }

    deleteLastMenu() {
        let menu = this.menuList.pop();
        if (!menu) return;
        let isThis = (menu == this.menu)? true : false;
        menu.destroy();
        if (isThis) {
            this.menu = (this.menuList.length > 0)? this.menuList[this.menuList.length-1] : null;
        }
    }

    talk() {
        if (!this.message) {
            if (this.npc) {
                this.npc.setTalking(true, this.members[0].direction);
                this.createTalkMenu(this.npc);
            } else {
                this.createTalkMenu();
                return;
            }
        } else {
            if (!this.message.updateTalk()) {
                this.isFinish = true;
                return;
            }
        }

        if (this.message.isConfirmYesNo()) {
            this.scene.time.delayedCall(800, () => {
                const strList = ["はい", "いいえ"];
                let menu1 = new Menu(this.menu, this.scene, strList, 305, WIN_Y+60, 190, 190);
                this.menuList.push(menu1);
                this.menu = menu1;
            });
        }
    }

    createTalkMenu(npc=null) {
        let parent = this.menu;
        let strList = [];
        if (this.command == COMMAND.TALK) {
            if (npc) strList = TalkManager.findTalks(this.scene.layer, npc);
        } else if (this.command == COMMAND.CHECK) {
            strList = [this.members[0].name + "は　あしもとを　しらべた。", "<btn>"];
        }
        this.menu.fixCursor(true);
        this.message = new Message(this.menu, this.scene, strList, 80, 270, 640, 320);

        if (npc && npc.name == "item") {
            this.scene.time.delayedCall(700, () => {
                // ゴールド表示
                const gameData = this.scene.cache.json.get("gameData");
                let menu1 = new Menu(parent, this.scene, null, 305, WIN_Y, 250, 130, 1, -1);
                this.menuList.push(menu1);
                menu1.drawText(20, 60, "Ｇ", '36px');
                menu1.drawText(70, 60, getNumberStr(gameData.gold, 5));
                const strList = ["かいにきた", "うりにきた", "やめる"];
                let menu2 = new Menu(parent, this.scene, strList, 305, 80, 250, 250);
                this.menuList.push(menu2);
                this.menu = menu2;
            });
        }
    }
}

function drawMembers(x, y) {
    let menu = this.menuList[this.menuList.length-1];
    let idx = menu.idx;
    menu.fixCursor(true);

    let nameList = [];
    this.members.forEach(member => nameList.push(member.name));
    menu = new Menu(menu, this.scene, nameList, x, y, 240, 310);
    menu.setTitle(cmdList[idx]);
    this.menuList.push(menu);
    this.menu = menu;

    if (this.command != COMMAND.SPELL) {
	    let member = this.members[0];
	    menu = new Menu(menu, this.scene, member.items, WIN_X+191, WIN_Y, 310, 430, 0, -1);
	    this.menuList.push(menu);
    }
}
