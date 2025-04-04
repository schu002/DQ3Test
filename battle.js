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

        // 四角形（外形：白、塗りつぶし：黒、角丸）
        const rectX = 130, rectY = 445, rectWidth = 700, rectHeight = 245, cornerRadius = 5;
        const graphics = this.add.graphics();
        graphics.lineStyle(14, 0xffffff); // 外形線を白
        graphics.fillStyle(0x000000); // 塗りつぶしを黒
        graphics.strokeRoundedRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);
        graphics.fillRoundedRect(rectX, rectY, rectWidth, rectHeight, cornerRadius);

        // BGM
	    this.bgm = this.sound.add("battleBGM", { loop: true, volume: 0.3 });
	    this.bgm.play();

        // 四角形の中に白いテキスト
        this.add.text(150, 480, "スライムが　あらわれた！", {
            fontFamily: "MisakiGothic",
            fontSize: "32px",
            color: "#ffffff",
        });

        // モンスター画像を表示
        this.add.image(480, 380, "Slime").setScale(2); // 画像の大きさ調整
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
