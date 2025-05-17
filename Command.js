import Menu, { MenuType, MenuFlags } from "./Menu.js";
import Message from "./Message.js";
import DrawStatus from "./DrawStatus.js";
import TalkManager from "./TalkManager.js";
import { getNumberStr, getEquipType } from "./util.js";

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
        let player = members[0];
	    this.npc = (layer)? layer.findNPC(player.pos, player.direction) : null;
	    if (this.npc) {
            this.command = COMMAND.TALK;
            this.talk();
        } else {
            this.status = new DrawStatus(scene, members, 80, 304);
        }
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
    }

    onButtonA() {
        if (!this.isListen) return;
        if (!this.curMenu || (this.message && this.message.isFinish())) {
            this.scene.exitCommand();
            return;
        }

        this.isListen = false;
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
                this.curMenu = this.createMenu(MenuType.Ability, strList, WIN_X-14, WIN_Y+60, 140, 125);
                this.curMenu.setTitle("つよさ", true);
            }
        }
        // そうび
        else if (this.command == COMMAND.EQUIP) {
            if (this.curMenu.type == MenuType.Command) {
		        drawMembers.call(this, 151, 45);
            } else if (this.curMenu.type == MenuType.Member) {
                this.buttonSound.play();
                this.member = this.members[this.curMenu.idx];
                let menu = this.menuList[this.menuList.length-1];
                menu.setVisible(false);
                this.curMenu.setVisible(false);
                let menu1 = this.createMenu(MenuType.Power, null, WIN_X, WIN_Y, 214, 126);
                // 装備一覧を左下に表示
                let menu2 = this.createMenu(MenuType.EquipList, null, WIN_X, WIN_Y+125, 170, 145);
                let items = this.member.getEquipItems();
                menu2.setStrList(items);
                // 装備選択画面を右上に表示
                let menu3 = this.createMenu(MenuType.SelectEquip, null, WIN_X+213, WIN_Y, 150, 0, MenuFlags.ShowCursor);
                menu3.setEquipment(this.member, EQUIP.WEAPON, menu1);
                this.curMenu = menu3;
            } else if (this.curMenu.type == MenuType.SelectEquip) {
                let type = getEquipType(this.curMenu.title);
                let itemName = this.curMenu.getCurString();
                let menu1 = this.findMenu(MenuType.Power);
                let menu2 = this.findMenu(MenuType.EquipList);
                this.member.setEquipItem(type, itemName);
                let items = this.member.getEquipItems();
                menu2.setStrList(items);
                if (type == EQUIP.HELMET) {
                    this.deleteCurMenu(false);
                } else {
                    this.curMenu.setEquipment(this.member, type+1, menu1);
                }
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

        this.isListen = true;
    }

    onButtonB() {
        if (!this.curMenu || (this.message && this.message.isFinish())) {
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

    update(dir) {
        if (!this.isListen) return;

        if (!this.curMenu || (this.message && this.message.isFinish())) {
            this.scene.exitCommand();
            return;
        }

        this.isListen = false;
        if (this.curMenu.moveCursor(dir)) {
            if (this.curMenu.type == MenuType.Member) {
                let menu = this.lastMenu();
                if (menu.type == MenuType.Item) {
                    let member = this.members[this.curMenu.idx];
                    menu.setStrList(member.items);
                }
            } else if (this.curMenu.type == MenuType.SelectEquip) {
                let menu = this.findMenu(MenuType.Power);
                if (menu) {
                    let str = this.curMenu.getCurString();
                    let type = getEquipType(this.curMenu.title);
                    menu.setEquipParam(this.member, type, str);
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

    findMenu(type) {
        for (let i = this.menuList.length-1; i >= 0; i--) {
            if (this.menuList[i].type == type) return this.menuList[i];
        }
        return null;
    }

    lastMenu() {
        return this.menuList[this.menuList.length-1];
    }

    removeMenu(menu) {
        let idx = this.menuList.indexOf(menu);
        if (idx >= 0) this.menuList.splice(idx);
        menu.destroy();
    }

    deleteCurMenu(setLast=true) {
        if (!this.curMenu) return;
        if (this.curMenu == this.mainMenu) {
            this.scene.exitCommand();
            return;
        }

        if (this.curMenu.type == MenuType.Member) {
            let menu = this.lastMenu();
            if (menu.type == MenuType.Item) this.removeMenu(menu);
        }

        this.removeMenu(this.curMenu);
        this.curMenu = null;
        if (setLast) {
            for (let i = this.menuList.length-1; i >= 0; i--) {
                if (this.menuList[i].flags & MenuFlags.ShowCursor) {
                    this.curMenu = this.menuList[i];
                    break;
                }
            }
        }
    }

    talk(pressA=false) {
        if (!this.message) {
            if (this.npc) {
                this.npc.setTalking(true, this.members[0].direction);
                this.createTalkMenu(this.npc);
            } else {
                this.createTalkMenu();
            }
        } else {
            if (pressA && this.curMenu && (this.curMenu.flags & MenuFlags.ShowCursor)) {
                this.curMenu.fixCursor(true);
            }

            this.message.update();
        }
    }

    createTalkMenu(npc=null) {
        let parent = this.curMenu;
        let strList = [];
        if (this.command == COMMAND.TALK) {
            if (npc) {
                strList = TalkManager.findTalks(this.scene.layer, npc);
            } else {
                strList = ["そのほうこうには　だれも　いない。"];
            }
        } else if (this.command == COMMAND.CHECK) {
            strList = [this.members[0].name + "は　あしもとを　しらべた。", "<btn>"];
        }
        this.curMenu.fixCursor(true);
        this.message = new Message(this.scene, 80, 270, 320, 160);
        this.message.setStrList(strList, this);
    }

    getSelectIndex() {
        return (this.curMenu)? this.curMenu.idx : -1;
    }

    getSelectString() {
        return (this.curMenu)? this.curMenu.getCurString() : "";
    }
}

function drawMembers(x, y, w=120) {
    let nameList = [];
    this.members.forEach(member => nameList.push(member.name));
    let h = 27 + nameList.length*32;
    let menu = this.createMenu(MenuType.Member, nameList, x, y, w, h, MenuFlags.ShowCursor);
    menu.setTitle(cmdList[this.command]);
    this.curMenu = menu;

    if (this.command != COMMAND.SPELL) {
	    let member = this.members[0];
        h = 27 + 8*32;
	    this.createMenu(MenuType.Item, member.items, WIN_X+191, WIN_Y, 155, h);
    }
}
