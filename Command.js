import Menu from "./Menu.js";

const COMMAND = {
    NONE	: -1,
    TALK	: 0,
    ABILITY	: 1,
    EQUIP	: 2,
    SPELL	: 3,
    TOOL	: 4,
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
        let menu = new Menu(scene, cmdList, x, y, 384, 252, 2);
        menu.setTitle("コマンド", true);
        this.menuList.push(menu);
        this.buttonSound = scene.sound.add("button", { loop: false, volume: 0.2 });
        this.buttonSound.play();

        scene.input.keyboard.on("keydown-Z", this.onButtonA, this);
        scene.input.keyboard.on("keydown-X", this.onButtonB, this);
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
	        } else if (menu.idx == COMMAND.TOOL) {
		        drawMembers.call(this, 238, 95);
	        }
        }
    }

    onButtonB() {
        let menu = this.menuList.pop();
        menu.destroy();
        if (this.menuList.length < 1) return;
        menu = this.menuList[this.menuList.length-1];
        menu.fixCursor(false);
    }

    update() {
        if (!this.isListen) return;

        let idx = this.command;
        if (idx > 0) {
            if (this.keys.up.isDown || this.wasd.up.isDown) {
                idx = (idx == 1 || idx == 4)? idx+2 : idx-1;
            } else if (this.keys.down.isDown || this.wasd.down.isDown) {
                idx = (idx == 3 || idx == 6)? idx-2 : idx+1;
            } else if (this.keys.left.isDown || this.wasd.left.isDown ||
                       this.keys.right.isDown || this.wasd.right.isDown) {
                idx += (idx <= 3)? 3 : -3;
            } else {
                return;
            }
        } else {
            idx = COMMAND.TALK;
        }

        this.isListen = false;
        this.setCursor(idx);

        this.scene.time.delayedCall(200, () => {
	        this.isListen = true;
        });
    }

    createCursor() {
        const w = 14, h = 26;
        this.cursor = this.scene.add.graphics();
        this.drawList.add(this.cursor);
        this.cursor.fillStyle(0xffffff, 1); // 白色、不透明
        this.cursor.beginPath();
        this.cursor.moveTo(0, 0);
        this.cursor.lineTo(4, 0);
        this.cursor.lineTo(w+4, h/2);
        this.cursor.lineTo(4, h);
        this.cursor.lineTo(0, h);
        this.cursor.closePath();
        this.cursor.fillPath();
        this.setCursor(1);
    }

    setCursor(idx) {
        if (!this.cursor) return;
        this.cursor.x = 42+Math.floor((idx-1)/3)*167;
        this.cursor.y = 62+(idx-1)%3*63;
        this.command = idx;
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
    menu = new Menu(this.scene, nameList, x, y, 240, 310);
    menu.setTitle(cmdList[idx]);
    this.menuList.push(menu);
}

export default Command;
