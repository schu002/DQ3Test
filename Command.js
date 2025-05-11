import Menu, { MenuType, MenuFlags } from "./Menu.js";
import Message from "./Message.js";
import DrawStatus from "./DrawStatus.js";
import TalkManager from "./TalkManager.js";
import { getNumberStr } from "./util.js";

const WIN_X = 40 * SCALE;
const WIN_Y = 8 * SCALE;
const WIN_W = 192;
const WIN_H = 126;
const cmdList = ["はなす", "つよさ", "そうび", "じゅもん", "どうぐ", "しらべる"];

export default class Command {
    constructor(scene, members, layer=null) {
        this.scene = scene;
        this.members = members;
        this.command = COMMAND.NONE;
        this.menuList = [];
        this.message = null;
        this.status = null;
        let flags = MenuFlags.Default|MenuFlags.MultiCols;
        this.mainMenu = new Menu(MenuType.Command, scene, cmdList, WIN_X, WIN_Y, WIN_W, WIN_H, flags);
        this.mainMenu.setTitle("コマンド", true);
        this.curMenu = this.mainMenu;
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
        this.mainMenu.destroy();
        if (this.npc) this.npc.setTalking(false);
        if (this.message) this.message.destroy();
        if (this.status) this.status.destroy();
        this.scene.input.keyboard.off("keydown-Z", this.onButtonA, this);
        this.scene.input.keyboard.off("keydown-X", this.onButtonB, this);
        this.timer.remove();
    }

    onButtonA() {
        if (this.isFinish) {
            this.scene.exitCommand();
            return;
        }

        this.buttonSound.play();
        this.command = this.mainMenu.idx;
        if (this.curMenu == this.mainMenu) this.curMenu.fixCursor(true);
        // はなす
        if (this.command == COMMAND.TALK) {
            this.talk(true);
        }
        // つよさ
        else if (this.command == COMMAND.ABILITY) {
            if (this.menuList.length == 1) {
                const strList = ["つよさをみる", "じょうたい", "ならびかた"];
                this.curMenu = createMenu(MenuType.Ability, strList, WIN_X-14, WIN_Y+60, 140, 125);
                this.curMenu.setTitle("つよさ", true);
            }
        }
        // そうび
        else if (this.command == COMMAND.EQUIP) {
            if (this.menuList.length == 0) {
		        drawMembers.call(this, 151, 45);
            } else if (this.menuList.length == 2) {
		        if (this.curMenu.nest == 1) {
                    this.buttonSound.play();
	                this.member = this.members[this.curMenu.idx];
                    let menu = this.menuList[this.menuList.length-1];
	                menu.setVisible(false);
	                this.curMenu.setVisible(false);
	                let menu1 = createMenu(MenuType.Power, null, WIN_X, WIN_Y, 214, 126);
	                // 装備一覧を左下に表示
	                let menu2 = createMenu(MenuType.Equipment, null, WIN_X, WIN_Y+125, 170, 145);
	                menu2.setStrList(this.member.items, true);
	                // 装備選択画面を右上に表示
	                let menu3 = createMenu(MenuType.SelectEquip, null, WIN_X+213, WIN_Y, 150, 0);
	                menu3.setEquipment(this.member, menu1, EQUIP.WEAPON);
	                this.curMenu = menu3;
		        }
            } else if (this.menuList.length > 2) {
	            console.log("meshList", this.menuList.length);
            }
        }
        // じゅもん
        else if (this.command == COMMAND.SPELL) {
            if (this.menuList.length == 0) {
		        drawMembers.call(this, 166, 47);
            }
        }
        // どうぐ
        else if (this.command == COMMAND.ITEM) {
            if (this.menuList.length == 0) {
		        drawMembers.call(this, 158, 79, 114);
            } else if (this.menuList.length == 2) {
		        if (this.curMenu.nest == 1) {
                    this.member = this.members[this.menu.idx];
                    this.curMenu.fixCursor(true);
                    this.curMenu = this.menuList[this.menuList.length-1];
                    this.curMenu.setCursor(0);
                    this.buttonSound.play();
		        }
            }
        }
        // しらべる
        else if (this.command == COMMAND.CHECK) {
	        if (!this.message) {
	            this.createTalkMenu();
	        }
        }
    }

    onButtonB() {
        if (this.isFinish) {
            this.scene.exitCommand();
            return;
        }
        let nest = this.curMenu.nest;
        if (this.command == COMMAND.TALK) {
            if (this.curMenu) {
                let chk = this.curMenu.onButtonB();
                this.talk();
                if (chk) return;
            }
        } else if (this.command == COMMAND.ITEM) {
            this.scene.exitCommand();
            return;
        } else if (this.command == COMMAND.EQUIP) {
            if (this.menuList.length == 6) {
                for (let i = 0; i < 3; i++) {
                    this.deleteCurMenu();
                }
                this.menuList[1].setVisible(true);
                this.menuList[2].setVisible(true);
                this.curMenu = this.menuList[1];
                return;
            }
        }

        this.deleteCurMenu();
        if (this.menuList.length < 1) {
            this.scene.exitCommand();
            return;
        }
    }

    update() {
        if (!this.isListen) return;

        let dir = -1;
        if		(this.keys.up.isDown || this.wasd.up.isDown) dir = DIR.UP;
        else if (this.keys.down.isDown || this.wasd.down.isDown) dir = DIR.DOWN;
        else if (this.keys.left.isDown || this.wasd.left.isDown) dir = DIR.LEFT;
        else if (this.keys.right.isDown || this.wasd.right.isDown) dir = DIR.RIGHT;
        else return;

        if (this.isFinish) {
            this.scene.exitCommand();
            return;
        }

        this.isListen = false;
        if (this.curMenu.moveCursor(dir)) {
            if (this.curMenu.nest == 1 && this.menuList.length == 3) {
                if (this.command == COMMAND.EQUIP || this.command == COMMAND.ITEM) {
	                let member = this.members[this.curMenu.idx];
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

    createMenu(type, strList, x, y, w, h, flags=0) {
        let menu = new Menu(type, this.scene, strList, x, y, w, h, flags);
        this.menuList.push(menu);
        if (flags & MenuFlags.ShowCursor) this.curMenu = menu;
        return menu;
    }

    deleteCurMenu() {
        if (!this.curMenu) return;
        if (this.curMenu == this.mainMenu) {
            this.scene.exitCommand();
            return;
        }
        let lastMenu = null;
        let delidx = -1;
        for (let i = this.menuList.length-1; i >= 0; i--) {
            let menu = this.menuList[i];
            if (menu == this.curMenu) {
                delidx = i;
            } else if (menu.flags & MenuFlags.ShowCursor) {
                if (!lastMenu) lastMenu = menu;
            }
        }

        if (delidx >= 0) this.menuList.splice(delidx);
        this.curMenu.destroy();
        this.curMenu = (lastMenu)? lastMenu : this.mainMenu;
    }

    talk(pressA=false) {
        if (!this.message) {
            if (this.npc) {
                this.npc.setTalking(true, this.members[0].direction);
                this.createTalkMenu(this.npc);
            } else {
                this.createTalkMenu();
                this.isFinish = true;
                return;
            }
        } else {
            if (pressA && this.curMenu && (this.curMenu.flags & MenuFlags.ShowCursor)) {
                this.curMenu.fixCursor(true);
            }

            if (!this.message.updateTalk()) {
                this.isFinish = true;
                return;
            }
        }
    }

    createTalkMenu(npc=null) {
        let parent = this.curMenu;
        let strList = [], canTalk = false;
        if (this.command == COMMAND.TALK) {
            if (npc) {
                strList = TalkManager.findTalks(this.scene.layer, npc);
                canTalk = true;
            } else {
                strList = ["そのほうこうには　だれも　いない。"];
            }
        } else if (this.command == COMMAND.CHECK) {
            strList = [this.members[0].name + "は　あしもとを　しらべた。", "<btn>"];
        }
        this.curMenu.fixCursor(true);
        this.message = new Message(this, strList, canTalk, 80, 270, 640, 320);
    }

    getSelectIndex() {
        return (this.curMenu)? this.curMenu.idx : -1;
    }

    getSelectString() {
        return (this.curMenu)? this.curMenu.getCurString() : "";
    }
}

function drawMembers(x, y, w=120) {
    // let menu = this.menuList[this.menuList.length-1];
    // let idx = menu.idx;
    // menu.fixCursor(true);

    let nameList = [];
    this.members.forEach(member => nameList.push(member.name));
    let h = 27 + nameList.length*32;
    let menu = this.createMenu(MenuType.Member, nameList, x, y, w, h, MenuFlags.ShowCursor);
    menu.setTitle(cmdList[this.command]);
    this.curMenu = menu;

    if (this.command != COMMAND.SPELL) {
	    let member = this.members[0];
        h = 27 + member.items.length*32;
	    this.createMenu(MenuType.Item, member.items, WIN_X+191, WIN_Y, 155, h);
    }
}
