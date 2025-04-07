import MonsterData from "./MonsterData.js";
import OccupationData from "./OccupationData.js";

const ACTION = {
	NONE	: 0,
	ATTACK	: 1,
	SPELL	: 2,
	DEFENSE	: 3,
	TOOL	: 4,
	ESCAPE	: 5
};

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
    }

    preload() {
        this.load.audio("battleBGM", "sound/battle2.mp3");
    }

    create() {
        this.members = this.sys.settings.data.members;
        this.action = ACTION.NONE;
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
        this.input.keyboard.on("keydown-Z", this.doAction, this);

        // BGM
	    this.bgm = this.sound.add("battleBGM", { loop: true, volume: 0.3 });
	    this.bgm.play();
	    this.buttonSound = this.sound.add("button", { loop: false, volume: 0.3 });

        const monster = MonsterData.getRandomMonster(1);

        // ステータス
        this.drawRect(130, 30, this.members.length*170+30, 180);
        for (let idx = 0; idx < this.members.length; idx++) {
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
        let text1 = this.drawText(130, 465, monster.name + "が　あらわれた！");

        const texture = this.textures.get(monster.name);
        const frame = texture.getSourceImage();
        let y = 410 - frame.height;

        // モンスター画像を表示
        this.add.image(480, y, monster.name).setScale(2); // 画像の大きさ調整

        // コマンド
        this.time.delayedCall(1200, () => {
            rect1.destroy();
            text1.destroy();
            this.drawCommand(0);
	        this.drawText(400, 470, monster.name);
	        this.drawText(650, 470, "— １ひき");
		    this.setAction(ACTION.ATTACK);
	        this.isListen = true;
        });
    }

    update() {
        if (!this.isListen) return;

        let act = this.action;
        if		(this.keys.up.isDown   || this.wasd.up.isDown)   act--;
        else if (this.keys.down.isDown || this.wasd.down.isDown) act++;
        else return;

        this.isListen = false;
        if (act < ACTION.ATTACK) act = ACTION.TOOL;
        else if (act > ACTION.TOOL) act = ACTION.ATTACK;

        this.setAction(act);

        this.time.delayedCall(250, () => {
	        this.isListen = true;
        });
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

    drawFill(x, y, w, h) {
        let rect = this.add.graphics();
        rect.fillStyle(0x000000); // 塗りつぶしを黒
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

    drawCommand(idx) {
        this.drawRect(130, 445, 220, 245, this.members[idx].name);
        this.drawRect(370, 445, 460, 90);
        let actList = this.getActionList(idx);
        for (let idx = 0; idx < actList.length; idx++) {
	        this.drawText(160, 470+idx*55, getActionStr(actList[idx]));
        }
    }

    getActionList(idx) {
        let actList = [];
        actList.push(ACTION.ATTACK);
        let isSoldier = (this.members[idx].occupation == "soldier")? true : false;
        if (idx == 0) {
	        if (isSoldier) {
		        actList.push(ACTION.ESCAPE);
		        actList.push(ACTION.DEFENSE);
	        } else {
		        actList.push(ACTION.SPELL);
		        actList.push(ACTION.ESCAPE);
	        }
        } else {
	        if (!isSoldier) actList.push(ACTION.SPELL);
	        actList.push(ACTION.DEFENSE);
        }
        actList.push(ACTION.TOOL);
        return actList;
    }

    doAction() {
        if (!this.isListen) return;
        if (this.action == ACTION.NONE) return;

        this.isListen = false;
	    this.buttonSound.play();
        if (this.action == ACTION.ATTACK) {
		    this.cursor.destroy();
            this.selectMonster(0);
        } else if (this.action == ACTION.ESCAPE) {
            this.exitBattle();
        }

        this.time.delayedCall(250, () => {
	        this.isListen = true;
        });
    }

    setAction(act) {
        if (this.action == act) return;

        if (this.action != ACTION.NONE) {
		    this.cursor.destroy();
        }

        this.action = act;
	    let y = 483 + (this.action-ACTION.ATTACK) * 55;
	    this.drawCursor(155, y);
    }

    drawCursor(x, y) {
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
        this.tweens.add({
            targets: this.cursor,
            alpha: { from: 1, to: 0 },
            ease: 'Linear',
            duration: 250,
            yoyo: true,
            repeat: -1
        });
    }

    selectMonster(idx) {
	    this.drawCursor(395, 483);
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
