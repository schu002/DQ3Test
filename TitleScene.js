import TownScene from "./town.js";
import MonsterData from "./MonsterData.js";

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: "TitleScene" });
    }

    preload() {
        // 背景色を黒に
        this.cameras.main.setBackgroundColor("#000000");

        // 町
        this.load.image("townTiles", "image/town.png"); // タイルセット画像
        this.load.tilemapTiledJSON("townMap", "data/ariahan.json");
        this.load.json("townData", "data/ariahan.json");
        this.load.audio("townBGM", "sound/town.mp3");
        this.load.audio("button", "sound/button.mp3");
        // フィールド
        this.load.tilemapTiledJSON("fieldMap", "data/field.json"); // 繝槭ャ繝励ョ繝シ繧ソ
	    this.load.image("fieldTiles", "image/field.png"); // 繧ソ繧、繝ォ繧サ繝ヨ逕サ蜒庶
	    this.load.json("fieldData", "data/field.json");
	    this.load.audio("fieldBGM", "sound/field1.mp3");
	    // モンスター
        this.load.json("monstersData", "data/monsters.json");

        WebFont.load({
	        custom: {
	            families: ['PixelMplus10-Regular'],
	            urls: ['fonts/PixelMplus10-Regular.css']
	        },
	        active: () => {
	            this.fontReady = true;
	        }
	    });
    }

    create() {
        const townData = this.cache.json.get("townData");
	    const fieldData = this.cache.json.get("fieldData");
	    if (!townData || !townData.player || !townData.objects || !fieldData) {
	    	console.error("Error: data not found in JSON.");
		    return;
	    }

        const playerData = townData.player;
	    this.load.spritesheet(playerData.name, playerData.image, { frameWidth: 32, frameHeight: 32 });

	    // 町人画像をロード
	    const npcData = townData.objects.town;
	    npcData.forEach(npc => {
	        this.load.spritesheet(npc.image, npc.image, { frameWidth: 32, frameHeight: 32 });
	    });

        this.load.once("complete", () => {
            console.log("load complete");
        }, this);
	    this.load.start();

        // preload() でロードした JSON を MonsterData に渡す
        MonsterData.loadData(this, () => {
            console.log("MonsterData loaded");
            this.cameras.main.fadeIn(1000, 0, 0, 0);
            // タイトルテキストを表示
            this.add.text(200, 300, "DRAGON QUEST3", {
                fontSize: "36px",
                color: "#ffffff",
                fontFamily: "Arial",
            }).setOrigin(0.5).setPosition(this.cameras.main.width / 2, this.cameras.main.height / 2);

            // 入力待ち
            this.input.keyboard.once("keydown", () => {
                this.scene.start("TownScene"); // 町のシーンへ移動
            });
        });
    }
}

export default TitleScene;
