class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: "BattleScene" });
    }

    preload() {
        this.load.image("Slime", "data/3_001.png"); // モンスター画像をロード
        this.load.audio("battleBGM", "data/battle2.mp3");
    }

    create(player) {
        this.time.delayedCall(500, () => {
	        this.input.keyboard.once("keydown", () => {
	            this.exitBattle();
	        });
	    });

        this.player = player;
        // 背景を黒に設定
        this.cameras.main.setBackgroundColor("#000000");

        // BGM
	    this.bgm = this.sound.add("battleBGM", { loop: true, volume: 0.3 });
	    this.bgm.play();

        // 四角形（外形：白、塗りつぶし：黒、角丸）
        this.rect1 = this.drawRect(130, 445, 700, 245);

        // 四角形の中に白いテキスト
        this.text1 = this.drawText(130, 445, "スライムが　あらわれた！");

        // モンスター画像を表示
        this.add.image(480, 380, "Slime").setScale(2); // 画像の大きさ調整

        this.time.delayedCall(1000, () => {
            this.rect1.destroy();
            this.text1.destroy();
	        this.drawRect(130, 445, 220, 245, "しゅう");
	        this.drawRect(370, 445, 460, 90);
	        this.drawText(160, 450, "たたかう");
	        this.drawText(160, 505, "にげる");
	        this.drawText(160, 560, "ぼうぎょ");
	        this.drawText(160, 615, "どうぐ");
	        this.drawText(400, 450, "スライム　　　　— １ひき");
		    this.drawCursor(140, 450);
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

    drawCursor(x, y) {
        const cursor = this.add.graphics();
        cursor.fillStyle(0xffffff, 1); // 白色、不透明

        const w = 16, h = 25;
        x += 15;
        y += 34;
        cursor.beginPath();
        cursor.moveTo(x, y);
        cursor.lineTo(x+w, y+h/2);
        cursor.lineTo(x, y+h);
        cursor.closePath();
        cursor.fillPath();
        this.tweens.add({
            targets: cursor,
            alpha: { from: 1, to: 0 },
            ease: 'Linear',
            duration: 200,
            yoyo: true,
            repeat: -1
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

export default BattleScene;
