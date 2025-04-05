import MonsterData from "./MonsterData.js";

const ACTION = {
	NONE	: 0,
	ATTACK	: 1,
	ESCAPE	: 2,
	DEFENSE	: 3,
	TOOL	: 4
};

class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
    }

    preload() {
        this.load.audio("battleBGM", "sound/battle2.mp3");
    }

    create(player) {
        this.player = player;
        this.action = ACTION.NONE;
        this.isListen = false;
        this.monsterData = new MonsterData(this);

        // 背景を黒に設定
        this.cameras.main.setBackgroundColor("#000000");

        this.keys = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on("keydown-A", this.doAction, this);

        // BGM
	    this.bgm = this.sound.add("battleBGM", { loop: true, volume: 0.3 });
	    this.bgm.play();
	    this.buttonSound = this.sound.add("button", { loop: false, volume: 0.3 });

        const monster = MonsterData.getRandomMonster(1);
        console.log("random", monster);

        // 四角形（外形：白、塗りつぶし：黒、角丸）
        this.rect1 = this.drawRect(130, 445, 700, 245);

        // 四角形の中に白いテキスト
        this.text1 = this.drawText(130, 445, monster.name + "が　あらわれた！");

        const texture = this.textures.get(monster.name);
        const frame = texture.getSourceImage();
        let y = 410 - frame.height;

        // モンスター画像を表示
        this.add.image(480, y, monster.name).setScale(2); // 画像の大きさ調整

        this.time.delayedCall(1200, () => {
            this.rect1.destroy();
            this.text1.destroy();
	        this.drawRect(130, 445, 220, 245, "しゅう");
	        this.drawRect(370, 445, 460, 90);
	        this.drawText(160, 450, "たたかう");
	        this.drawText(160, 505, "にげる");
	        this.drawText(160, 560, "ぼうぎょ");
	        this.drawText(160, 615, "どうぐ");
	        this.drawText(400, 450, monster.name);
	        this.drawText(650, 450, "— １ひき");
		    this.setAction(ACTION.ATTACK);
	        this.isListen = true;
        });
    }

    update() {
        if (!this.isListen) return;

        let act = this.action;
        if		(this.keys.up.isDown)	act--;
        else if (this.keys.down.isDown) act++;
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
            this.drawText(x+30, y-45, title);
        }
        return rect;
    }

    drawText(x, y, msg) {
        let txt = this.add.text(x+20, y+30, msg, {
            fontFamily: "PixelMplus10-Regular",
            fontSize: "32px",
            color: "#ffffff",
        });
        return txt;
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
	        console.log("exitBattle");
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

export default BattleScene;
