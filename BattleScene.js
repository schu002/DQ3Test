import MonsterData from "./MonsterData.js";
import OccupationData from "./OccupationData.js";
import DrawStatus from "./DrawStatus.js";
import Message from "./Message.js";

const ACTWIN_Y = 560;

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
        this.drawMonsterImage();

        // ステータス
        this.status = new DrawStatus(this, this.members, 66, 21);

        // メッセージウィンドウ
        this.message = new Message(this, 63, 276, 370, 154);
        let textList = [];
        for (let i = 0; i < this.monsters.length; i++) {
            textList.push(this.monsters[i].name + "が　あらわれた！");
        }
        this.message.setStrList(textList);

        // コマンド
        this.time.delayedCall(1200, () => {
            this.message.setVisible(false);
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

        this.time.delayedCall(200, () => {
	        this.isListen = true;
        });
    }

    setCursor(idx, blink=true) {
        let x, y = ACTWIN_Y + 48 + idx * 64;
        let member = this.members[this.memberIdx];
        if (member.action != ACTION.NONE) {
            this.monsterIdx = idx;
            x = 405;
        } else {
            this.actIdx = idx;
            x = 160;
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
        rect.lineStyle(14, 0xffffff);
        rect.fillStyle(0x000000);
        rect.strokeRoundedRect(x, y, w, h, 5);
        rect.fillRoundedRect(x, y, w, h, 5);
        if (title) {
            rect.fillRect(x+47, y-10, w-96, 10);
            this.drawText(x+50, y-18, title);
        }
        return rect;
    }

    drawFill(x, y, w, h, col=0x000000) {
        let rect = this.add.graphics();
        rect.fillStyle(col);
        rect.fillRect(x, y, w, h);
    }

    drawText(x, y, msg, textList=null) {
        for (const ch of msg) {
	        let text = this.add.text(x, y, ch, {
	            fontFamily: "PixelMplus10-Regular",
	            fontSize: '38px',
	            color: '#ffffff'
            });
	        text.setScale(0.9, 1.0);
	        x += 30;
	        if (textList) textList.push(text);
	    }
    }

    drawAction() {
        let idx = this.memberIdx;
        if (idx < 0 || idx >= this.members.length) return;

        let y = ACTWIN_Y;
        this.drawRect(132, y, 230, 290, this.members[idx].name);
        y += 40;
        this.setActionList(idx);
        for (let i = 0; i < this.actList.length; i++) {
            this.drawText(182, y+i*64, getActionStr(this.actList[i]));
        }
    }

    drawMonster() {
        let y = ACTWIN_Y;
        this.drawRect(382, y, 478, 60+this.monsters.length*50);
        y += 40;
        for (let i = 0; i < this.monsters.length; i++) {
            this.drawText(430, y+i*64, this.monsters[i].name);
            this.drawText(680, y+i*64, "— １ひき");
        }
    }

    drawMonsterImage() {
        let allwidth = 0;
        for (let idx = 0; idx < this.monsters.length; idx++) {
            let monster = this.monsters[idx];
            const texture = this.textures.get(monster.name);
            const frame = texture.getSourceImage();
            allwidth += frame.width*2;
            if (idx > 0) allwidth += 60;
        }

        let x = 550 - allwidth/2;
        for (let idx = 0; idx < this.monsters.length; idx++) {
            let monster = this.monsters[idx];
            const texture = this.textures.get(monster.name);
            const frame = texture.getSourceImage();
            let y = ACTWIN_Y - 60 - frame.height * 0.6;
            this.add.image(x, y, monster.name).setScale(2.2); // 画像の大きさ調整
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
    	    this.drawFill(147, ACTWIN_Y+10, 30, 200);
    	    this.monsterIdx = -1;
    	    member.action = ACTION.NONE;
	        this.setCursor(0);
        } else if (this.memberIdx > 0) {
    	    this.cursor.destroy();
    	    this.drawFill(147, ACTWIN_Y+10, 30, 200);
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

function getActionStr(act) {
    let actions = ["", "こうげき", "じゅもん", "ぼうぎょ", "どうぐ", "にげる"];
    return actions[act];
}

export default BattleScene;
