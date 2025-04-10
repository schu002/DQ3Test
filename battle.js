import MonsterData from "./MonsterData.js";
import OccupationData from "./OccupationData.js";

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
    }

    preload() {
        this.load.audio("battleBGM", "sound/battle2.mp3");
    }

    create() {
        this.members = this.sys.settings.data.members;
        this.memberIdx = 0;
        this.monsters = [];
        this.monsterIdx = -1;
        this.actList = [];
        this.actIdx = -1;
        this.isListen = false;

        // 背景を黒に設定
        this.cameras.main.setBackgroundColor("#000000");

        this.keys = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
    	    up: Phaser.Input.Keyboard.KeyCodes.W,
    	    down: Phaser.Input.Keyboard.KeyCodes.S,
    	    left: Phaser.Input.Keyboard.KeyCodes.A,
    	    right: Phaser.Input.Keyboard.KeyCodes.D
    	});
        this.input.keyboard.on("keydown-Z", this.onButtonA, this);
        this.input.keyboard.on("keydown-X", this.onButtonB, this);

        // BGM
        this.bgm = this.sound.add("battleBGM", { loop: true, volume: 0.3 });
        this.bgm.play();
        this.buttonSound = this.sound.add("button", { loop: false, volume: 0.3 });

        this.monsters.push(MonsterData.getRandomMonster(1));
        this.monsters.push(MonsterData.getRandomMonster(1));

        // ステータス
        this.drawRect(130, 30, this.members.length*170+30, 180);
        for (let idx = 0; idx < this.members.length; idx++) {
            this.members[idx].action = ACTION.NONE;
            this.drawFill(150+idx*170, 16, 130, 20);
            this.drawText(130+idx*170, 5, this.members[idx].name);
            this.drawText(130+idx*170, 55, "Ｈ");
            this.drawText(160+idx*170, 55, getNumberStr(this.members[idx].hp));
            this.drawText(130+idx*170, 105, "Ｍ");
            this.drawText(160+idx*170, 105, getNumberStr(this.members[idx].mp));
            this.drawText(130+idx*170, 155, headName(this.members[idx].occupation));
            this.drawText(160+idx*170, 155, getNumberStr(this.members[idx].level));
        }

        let rect1 = this.drawRect(130, 445, 700, 245);
        let textList = [];
        for (let i = 0; i < this.monsters.length; i++) {
            textList.push(this.drawText(130, 465+i*50, this.monsters[i].name + "が　あらわれた！"));
        }

        this.drawMonsterImage();

        // コマンド
        this.time.delayedCall(1200, () => {
            rect1.destroy();
            textList.forEach(text => { text.destroy(); });
            this.drawAction();
            this.drawMonster();
            this.isListen = true;
        });
    }

    update() {
        if (!this.isListen) return;

        let member = this.members[this.memberIdx];
        let idx = (member.action != ACTION.NONE)? this.monsterIdx : this.actIdx;
        let len = (member.action != ACTION.NONE)? this.monsters.length : this.actList.length;
        if (idx >= 0) {
	        if (len < 2) return;
	        if		(this.keys.up.isDown   || this.wasd.up.isDown)   idx--;
	        else if (this.keys.down.isDown || this.wasd.down.isDown) idx++;
	        else return;
	        if (idx < 0) idx = len-1;
	        else if (idx >= len) idx = 0;
            this.cursor.destroy();
        } else {
            idx = 0;
        }

        this.isListen = false;
        this.setCursor(idx);

        this.time.delayedCall(250, () => {
	        this.isListen = true;
        });
    }

    setCursor(idx, blink=true) {
        let x, y;
        let member = this.members[this.memberIdx];
        if (member.action != ACTION.NONE) {
            this.monsterIdx = idx;
            x = 395;
    	    y = 483 + idx * 55;
        } else {
            this.actIdx = idx;
            x = 155;
    	    y = 483 + idx * 55;
        }

	    this.drawCursor(x, y, blink);
    }

    drawCursor(x, y, blink=true) {
        const w = 14, h = 26;
        this.cursor = this.add.graphics();
        this.cursor.fillStyle(0xffffff, 1); // 白色、不透明
        this.cursor.beginPath();
        this.cursor.moveTo(x, y);
        this.cursor.lineTo(x+4, y);
        this.cursor.lineTo(x+w+4, y+h/2);
        this.cursor.lineTo(x+4, y+h);
        this.cursor.lineTo(x, y+h);
        this.cursor.closePath();
        this.cursor.fillPath();
        if (blink) {
	        this.tweens.add({
	            targets: this.cursor,
	            alpha: { from: 1, to: 0 },
	            ease: 'Linear',
	            duration: 250,
	            yoyo: true,
	            repeat: -1
	        });
        }
    }

    drawRect(x, y, w, h, title="") {
        let rect = this.add.graphics();
        rect.lineStyle(14, 0xffffff); // 外形線を白
        rect.fillStyle(0x000000); // 塗りつぶしを黒
        rect.strokeRoundedRect(x, y, w, h, 5);
        rect.fillRoundedRect(x, y, w, h, 5);
        if (title) {
            rect.fillRect(x+45, y-15, w-90, 15);
            this.drawText(x+30, y-25, title);
        }
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.add.graphics();
        rect.fillStyle(col); // 塗りつぶしを黒
        rect.fillRect(x, y, w, h);
    }

    drawText(x, y, msg) {
        let txt = this.add.text(x+20, y+10, msg, {
            fontFamily: "PixelMplus10-Regular",
            fontSize: "32px",
            color: "#ffffff",
        });
        return txt;
    }

    drawAction() {
        let idx = this.memberIdx;
        if (idx < 0 || idx >= this.members.length) return;

        this.drawRect(130, 445, 220, 245, this.members[idx].name);
        this.setActionList(idx);
        for (let i = 0; i < this.actList.length; i++) {
            this.drawText(160, 470+i*55, getActionStr(this.actList[i]));
        }
    }

    drawMonster() {
        this.drawRect(370, 445, 460, 40+this.monsters.length*50);
        for (let i = 0; i < this.monsters.length; i++) {
            let y = 470 + i*55;
            this.drawText(400, y, this.monsters[i].name);
            this.drawText(650, y, "— １ひき");
        }
    }

    drawMonsterImage() {
        let allwidth = 0;
        for (let idx = 0; idx < this.monsters.length; idx++) {
            let monster = this.monsters[idx];
            const texture = this.textures.get(monster.name);
            const frame = texture.getSourceImage();
            allwidth += frame.width*2;
            if (idx > 0) allwidth += 50;
        }

        let x = 550 - allwidth/2;
        for (let idx = 0; idx < this.monsters.length; idx++) {
            let monster = this.monsters[idx];
            const texture = this.textures.get(monster.name);
            const frame = texture.getSourceImage();
            let y = 410 - frame.height;
            this.add.image(x, y, monster.name).setScale(2); // 画像の大きさ調整
            x += frame.width*2 + 50;
        }
    }

    setActionList(idx) {
        this.actList = [];
        this.actList.push(ACTION.ATTACK);
        let isSoldier = (this.members[idx].occupation == "soldier")? true : false;
        if (idx == 0) {
            if (isSoldier) {
    	        this.actList.push(ACTION.ESCAPE);
    	        this.actList.push(ACTION.DEFENSE);
            } else {
    	        this.actList.push(ACTION.SPELL);
    	        this.actList.push(ACTION.ESCAPE);
            }
        } else {
            if (!isSoldier) this.actList.push(ACTION.SPELL);
            this.actList.push(ACTION.DEFENSE);
        }
        this.actList.push(ACTION.TOOL);
    }

    onButtonA() {
        if (!this.isListen) return;
        if (this.actIdx < 0) return;

        this.isListen = false;
        this.buttonSound.play();
        let member = this.members[this.memberIdx];
        if (member.action == ACTION.NONE) {
	        this.setCursor(this.actIdx, false);
	        member.action = this.actList[this.actIdx];
	        if (member.action == ACTION.ATTACK) {
	    	    // this.cursor.destroy();
	    	    this.monsterIdx = -1;
	        } else if (member.action == ACTION.ESCAPE) {
	            this.exitBattle();
	        }
        } else {
            if (this.memberIdx >= this.members.length-1) {
            	// Battle start
            } else {
	    	    this.cursor.destroy();
	            this.memberIdx++;
	            this.actIdx = -1;
	            this.drawAction();
            }
        }

        this.time.delayedCall(250, () => {
            this.isListen = true;
        });
    }

    onButtonB() {
        if (!this.isListen) return;

        this.isListen = false;
        this.buttonSound.play();
        let member = this.members[this.memberIdx];
        if (member.action != ACTION.NONE) {
    	    this.cursor.destroy();
    	    this.drawFill(147, 480, 30, 200);
    	    this.monsterIdx = -1;
    	    member.action = ACTION.NONE;
	        this.setCursor(0);
        } else if (this.memberIdx > 0) {
    	    this.cursor.destroy();
    	    this.drawFill(147, 480, 30, 200);
    	    this.monsterIdx = this.actIdx = -1;
	        this.members[--this.memberIdx].action = ACTION.NONE;
	        this.drawAction();
        }

        this.time.delayedCall(250, () => {
            this.isListen = true;
        });
    }

    exitBattle() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.bgm.stop();
            this.scene.stop();
            this.scene.resume("FieldScene");
        });
    }
}

function headName(occ) {
    if (occ == "soldier") return "せ：";
    if (occ == "hero") return "ゆ：";
    return "";
}

function getNumberStr(num) {
    let str = "";
    let mod = num;
    let nums = ["０", "１", "２", "３", "４", "５", "６", "７", "８", "９"];
    if (num >= 100) {
        let idx = Math.floor(mod/100);
        str = nums[idx];
        mod -= idx * 100;
    } else {
        str = (num >= 10)? "　" : "　　";
    }
    if (num >= 10) {
        let idx = Math.floor(mod/10);
        str += nums[idx];
        mod -= idx * 10;
    }
    if (num >= 0) {
        str += nums[mod];
    }
    return str;
}

function getActionStr(act) {
    let actions = ["", "こうげき", "じゅもん", "ぼうぎょ", "どうぐ", "にげる"];
    return actions[act];
}

export default BattleScene;
